"""Run orchestration — the pipeline of analyzer spec §2, ending in ONE run
object POSTed through the portal's ingest endpoint (§5). Every failure path
calls run-failed: the packet must never hang in processing."""
import asyncio
import datetime
import json
import secrets
import traceback
from pathlib import Path

import config
import portal
from judge import judge_document
from naming import derive_name
from parse import parse_document
from pdfs import render_pages
from scrutiny import apply_substitution_scrutiny, block_index, deep_scan, needs_deep_scan
from split_classify import (classify_segment, deterministic_boundaries,
                            llm_refine_boundaries, map_to_block, to_segments)
from taxonomy import TAXONOMY


async def execute_run(app_id: str, packet_sha256: str, gate: str) -> None:
    try:
        await asyncio.wait_for(_pipeline(app_id, packet_sha256, gate), timeout=config.RUN_TIMEOUT_S)
    except Exception as e:  # noqa: BLE001 — every failure reverts the portal state honestly
        reason = f"{type(e).__name__}: {e}" if not isinstance(e, asyncio.TimeoutError) else \
            f"run exceeded {config.RUN_TIMEOUT_S}s timeout"
        traceback.print_exc()
        try:
            await portal.post_run_failed(app_id, packet_sha256, reason)
        except Exception:  # noqa: BLE001
            traceback.print_exc()


async def _pipeline(app_id: str, packet_sha256: str, gate: str) -> None:
    problems = config.missing_backends()
    if problems:
        raise RuntimeError("analyzer backends not configured — " + "; ".join(problems))

    app = await portal.get_application(app_id)
    packet = app.get("packet") or {}
    if packet.get("sha256") != packet_sha256:
        raise RuntimeError("packet changed since this run was kicked")
    pf_flags: list[str] = (packet.get("preflight") or {}).get("flags", [])

    now = datetime.datetime.now(datetime.timezone.utc)
    run_id = f"run-{now:%Y%m%d-%H%M%S}-{secrets.token_hex(2)}"
    store = Path(config.STORE_DIR) / app_id / run_id
    store.mkdir(parents=True, exist_ok=True)
    ref = f"store://{app_id}/{run_id}"
    # Config + versions saved with the run's artifacts (spec v0.6.3 §2).
    (store / "config.json").write_text(json.dumps({
        "pipelineVersion": config.PIPELINE_VERSION,
        "spec": "homium-analyzer-spec-v0.6.3",
        "parse": {"backend": config.PARSE_BACKEND, "model": config.PARSE_MODEL},
        "judge": {"backend": config.JUDGE_BACKEND, "model": config.JUDGE_MODEL},
        "text": {"backend": config.TEXT_BACKEND, "model": config.TEXT_MODEL},
        "renderDpi": config.RENDER_DPI,
        "gate": gate,
        "packetSha256": packet_sha256,
    }, indent=2))

    pdf = await portal.get_packet_pdf(app_id)
    pdf_path = store / "packet.pdf"
    pdf_path.write_bytes(pdf)

    pages = await render_pages(str(pdf_path), str(store / "pages"))
    mds = await parse_document(pages, str(store / "md"))

    starts = await llm_refine_boundaries(mds, deterministic_boundaries(mds))
    segments = to_segments(starts, len(mds))

    blocks_by_id = block_index(app["template"])
    blocks = list(blocks_by_id.values())
    claimed: set[str] = set()
    taken_names: set[str] = set()
    documents: list[dict] = []
    unassigned: list[dict] = []

    for first, last in segments:
        seg_md = mds[first - 1]
        tax_id, desc = await classify_segment(seg_md)
        block_id = map_to_block(tax_id, blocks, claimed) if tax_id != "unassigned" else None
        if block_id is None:
            unassigned.append({"pages": [first, last], "description": desc})
            continue
        claimed.add(block_id)
        block = blocks_by_id[block_id]

        seg_pngs = [pages[first - 1]] + ([pages[last - 1]] if last > first else [])
        seg_flags = [f for f in pf_flags if _flag_touches(f, first, last)]
        verdict = await judge_document(TAXONOMY[tax_id]["display"], seg_md, seg_pngs, seg_flags)

        core = verdict["core_fields"]
        if core["primary_party_name"] == "unknown":
            core["primary_party_name"] = app.get("applicantName", "unknown")
        documents.append({
            "segment": {"pages": [first, last]},
            "suggestedBlockId": block_id,
            "confidence": 0.9 if block.get("docType") == tax_id else 0.7,
            "suggestedName": derive_name(core["document_date"], block_id, core.get("issuing_party"),
                                         core["primary_party_name"], taken_names),
            "coreFields": core,
            "scores": {
                "quality": verdict["quality"],
                "formatting": verdict["formatting"],
                "fraud_signal": verdict["fraud_signal"],
                "scrutinyTier": block.get("criticality") or "standard",
            },
            "flags": verdict["flags"],
            "extractions": [],  # always present — empty in v1, populated in v2 (spec §1.5)
            "artifacts": {
                "md": f"{ref}/md/p{first}.md",
                "pageRenders": [f"{ref}/pages/p-{n}.png" for n in range(first, last + 1)],
                "crops": [],
            },
        })

    apply_substitution_scrutiny(documents, app["template"], blocks_by_id)
    whisper = [f"Split {len(mds)} pages into {len(documents)} documents; {len(unassigned)} unassigned; "
               f"{sum(1 for d in documents if d['flags'])} flagged."]
    scan_reasons = needs_deep_scan(documents, blocks_by_id)
    if scan_reasons:
        findings = deep_scan(documents, app.get("applicantName", ""))
        whisper.append(f"Deep scan ({'; '.join(scan_reasons[:2])}): "
                       f"{len(findings)} cross-document finding(s)." if findings else
                       f"Deep scan ({'; '.join(scan_reasons[:2])}): no cross-document inconsistencies.")
    for d in documents:
        d.pop("_substituted_critical", None)

    run = {
        "runId": run_id,
        "startedAt": now.isoformat().replace("+00:00", "Z"),
        "pipelineVersion": config.PIPELINE_VERSION,
        "preflight": {"pages": len(mds), "flags": pf_flags, "gate": gate},
        "documents": documents,
        "unassigned": unassigned,
        "whisper": whisper,
    }
    status, body = await portal.post_run(app_id, run)
    if status != 201:
        raise RuntimeError(f"portal rejected the run ({status}): {body}")


def _flag_touches(flag: str, first: int, last: int) -> bool:
    import re
    for m in re.finditer(r"p\.?\s*(\d+)(?:\s*[–-]\s*(\d+))?", flag):
        a = int(m.group(1))
        b = int(m.group(2) or a)
        if a <= last and b >= first:
            return True
    return False
