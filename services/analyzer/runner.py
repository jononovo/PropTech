"""Run orchestration — the pipeline of analyzer spec §2, ending in ONE run
object POSTed through the portal's ingest endpoint (§5). Every failure path
calls run-failed: the packet must never hang in processing."""
import asyncio
import datetime
import json
import secrets
import time
import traceback
from pathlib import Path

import config
import portal
from models import resolve_plan
from judge import judge_document, prompt_version as judge_prompt_version
from naming import derive_name
from parse import parse_document
from pdfs import render_pages
from scrutiny import apply_substitution_scrutiny, block_index, deep_scan, needs_deep_scan
from split_classify import (classify_segment, deterministic_boundaries,
                            llm_refine_boundaries, map_to_block,
                            preflight_exclusions, to_segments)
from taxonomy import TAXONOMY


async def execute_run(app_id: str, packet_sha256: str, gate: str, plan_ids: dict | None = None) -> None:
    try:
        await asyncio.wait_for(_pipeline(app_id, packet_sha256, gate, plan_ids), timeout=config.RUN_TIMEOUT_S)
    except Exception as e:  # noqa: BLE001 — every failure reverts the portal state honestly
        reason = f"{type(e).__name__}: {e}" if not isinstance(e, asyncio.TimeoutError) else \
            f"run exceeded {config.RUN_TIMEOUT_S}s timeout"
        traceback.print_exc()
        try:
            await portal.post_run_failed(app_id, packet_sha256, reason)
        except Exception:  # noqa: BLE001
            traceback.print_exc()


async def _pipeline(app_id: str, packet_sha256: str, gate: str, plan_ids: dict | None) -> None:
    # Resolve the per-run model plan FIRST — unknown/unavailable options fail
    # loudly here, before any spend (never a silent engine substitution).
    plan = resolve_plan(plan_ids)

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
    # Config + versions saved with the run's artifacts (spec v0.6.3 §2). Rewritten
    # once at the END of the run with timings + artifactsProduced (judge-verdict-
    # artifacts spec) — immutable from the moment the run POSTs.
    run_config = {
        "pipelineVersion": plan.pipeline_version(),
        "spec": "homium-analyzer-spec-v0.6.3",
        "plan": plan.ids,
        "parse": {"backend": plan.parse.backend, "model": plan.parse.model},
        "judge": {"backend": plan.judge.backend, "model": plan.judge.model},
        "text": {"backend": plan.text.backend, "model": plan.text.model},
        "judgePromptVersion": judge_prompt_version(plan.fraud_scoring),
        "fraudScoring": plan.fraud_scoring,
        "renderDpi": config.RENDER_DPI,
        "gate": gate,
        "packetSha256": packet_sha256,
    }
    (store / "config.json").write_text(json.dumps(run_config, indent=2))
    timings = {"renderMs": 0, "parseMs": 0, "splitClassifyMs": 0, "judgeMs": 0, "totalMs": 0}
    t_run = time.monotonic()

    pdf = await portal.get_packet_pdf(app_id)
    pdf_path = store / "packet.pdf"
    pdf_path.write_bytes(pdf)

    t = time.monotonic()
    pages = await render_pages(str(pdf_path), str(store / "pages"))
    timings["renderMs"] = int((time.monotonic() - t) * 1000)
    t = time.monotonic()
    mds = await parse_document(pages, str(store / "md"), plan.parse, str(pdf_path))
    timings["parseMs"] = int((time.monotonic() - t) * 1000)

    t = time.monotonic()
    starts = await llm_refine_boundaries(mds, deterministic_boundaries(mds), plan.text)
    # Span-gluing rule (v0.7, all-parties approved): pages the deterministic
    # pre-flight called blank/exact-duplicate never join a span — they surface
    # below as visible junk in unassigned, never silently dropped.
    exclusions = preflight_exclusions(pf_flags)
    segments = to_segments(starts, len(mds), excluded_pages=set(exclusions))
    timings["splitClassifyMs"] += int((time.monotonic() - t) * 1000)

    blocks_by_id = block_index(app["template"])
    blocks = list(blocks_by_id.values())
    claimed: set[str] = set()
    taken_names: set[str] = set()
    documents: list[dict] = []
    unassigned: list[dict] = []
    for page in sorted(exclusions):  # junk stays VISIBLE — file or archive it, never a silent drop
        unassigned.append({"pages": [page, page],
                           "description": f"Pre-flight junk ({exclusions[page]}) — excluded from document "
                                          f"spans; kept visible to file or archive."})

    doc_pad = max(2, len(str(len(segments))))  # doc-01.json… — lexicographic listing, same lesson as pageRenders
    for first, last in segments:
        seg_md = mds[first - 1]
        t = time.monotonic()
        tax_id, desc = await classify_segment(seg_md, plan.text)
        timings["splitClassifyMs"] += int((time.monotonic() - t) * 1000)
        block_id = map_to_block(tax_id, blocks, claimed) if tax_id != "unassigned" else None
        if block_id is None:
            unassigned.append({"pages": [first, last], "description": desc})
            continue
        claimed.add(block_id)
        block = blocks_by_id[block_id]

        seg_pngs = [pages[first - 1]] + ([pages[last - 1]] if last > first else [])
        seg_flags = [f for f in pf_flags if _flag_touches(f, first, last)]
        t = time.monotonic()
        verdict, judge_meta = await judge_document(TAXONOMY[tax_id]["display"], seg_md, seg_pngs, seg_flags,
                                                   plan.judge, fraud_scoring=plan.fraud_scoring)
        timings["judgeMs"] += int((time.monotonic() - t) * 1000)

        doc_index = len(documents) + 1
        confidence = 0.9 if block.get("docType") == tax_id else 0.7
        # Audit-grade raw judge output (judge-verdict-artifacts spec): write-once
        # ("x" mode — a collision is a bug, fail loudly), BEFORE the run POST.
        # coreFields here are the judge's own, pre applicant-name fallback.
        judge_rel = f"judge/doc-{doc_index:0{doc_pad}d}.json"
        (store / "judge").mkdir(exist_ok=True)
        with open(store / judge_rel, "x", encoding="utf-8") as jf:
            json.dump({
                "docIndex": doc_index,
                "pages": [first, last],
                "taxonomyId": tax_id,
                "scores": {"quality": verdict["quality"], "formatting": verdict["formatting"],
                           **({"fraud_signal": verdict["fraud_signal"]} if "fraud_signal" in verdict else {}),
                           "confidence": confidence},
                "coreFields": verdict["core_fields"],
                "flags": verdict["flags"],
                "description": verdict["description"],
                **judge_meta,
                "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat().replace("+00:00", "Z"),
            }, jf, indent=2)

        core = verdict["core_fields"]
        if core["primary_party_name"] == "unknown":
            core["primary_party_name"] = app.get("applicantName", "unknown")
        documents.append({
            "segment": {"pages": [first, last]},
            "suggestedBlockId": block_id,
            "confidence": confidence,
            "suggestedName": derive_name(core["document_date"], block_id, core.get("issuing_party"),
                                         core["primary_party_name"], taken_names),
            "coreFields": core,
            "scores": {
                "quality": verdict["quality"],
                "formatting": verdict["formatting"],
                # absent when the plan turned fraud scoring off — the sidecar
                # carries "not scored", never a fabricated 0
                **({"fraud_signal": verdict["fraud_signal"]} if "fraud_signal" in verdict else {}),
                "scrutinyTier": block.get("criticality") or "standard",
            },
            "flags": verdict["flags"],
            "extractions": [],  # always present — empty in v1, populated in v2 (spec §1.5)
            "artifacts": {
                "judge": f"{ref}/{judge_rel}",
                "md": f"{ref}/md/p{first}.md",
                # pdftoppm zero-pads to the packet's page-count width (p-01.png for
                # 10 pages) — the URIs must reference the files as they exist on disk.
                "pageRenders": [f"{ref}/pages/p-{n:0{len(str(len(mds)))}d}.png" for n in range(first, last + 1)],
                "crops": [],
            },
        })

    apply_substitution_scrutiny(documents, app["template"], blocks_by_id)
    whisper = [f"Split {len(mds)} pages into {len(documents)} documents; {len(unassigned)} unassigned; "
               f"{sum(1 for d in documents if d['flags'])} flagged."]
    if exclusions:
        whisper.append("Span-gluing: excluded from spans: "
                       + ", ".join(f"p.{p} ({r})" for p, r in sorted(exclusions.items())) + ".")
    scan_reasons = needs_deep_scan(documents, blocks_by_id)
    if scan_reasons:
        findings = deep_scan(documents, app.get("applicantName", ""))
        whisper.append(f"Deep scan ({'; '.join(scan_reasons[:2])}): "
                       f"{len(findings)} cross-document finding(s)." if findings else
                       f"Deep scan ({'; '.join(scan_reasons[:2])}): no cross-document inconsistencies.")
    for d in documents:
        d.pop("_substituted_critical", None)

    timings["totalMs"] = int((time.monotonic() - t_run) * 1000)
    elements_dir = store / "elements"
    artifacts_produced = {  # per-engine honesty — what THIS run actually made
        "md": True,
        "elements": elements_dir.is_dir() and any(elements_dir.iterdir()),
        "crops": False,  # reserved; nothing pre-crops in v1
    }
    run_config["timings"] = timings
    run_config["artifactsProduced"] = artifacts_produced
    (store / "config.json").write_text(json.dumps(run_config, indent=2))

    run = {
        "runId": run_id,
        "startedAt": now.isoformat().replace("+00:00", "Z"),
        "pipelineVersion": plan.pipeline_version(),
        "fraudScoring": plan.fraud_scoring,
        "durationMs": timings["totalMs"],
        "artifactsProduced": artifacts_produced,
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
