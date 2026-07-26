"""Run orchestration — the pipeline of analyzer spec §2, ending in ONE run
object POSTed through the portal's ingest endpoint (§5). Every failure path
calls run-failed: the run must never hang in processing.

File-native (file-native-intake spec): the run's input is a SET OF FILES —
each fetched individually from the portal, rendered and parsed per file. All
addressing is (fileId, in-file page) via FileSpans; a span never crosses a
file boundary."""
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
from satisfaction import satisfaction_pass
from scrutiny import apply_substitution_scrutiny, block_index, deep_scan, needs_deep_scan
from split_classify import (classify_segment, deterministic_boundaries,
                            llm_refine_boundaries, map_to_block, to_segments)
from taxonomy import TAXONOMY


async def execute_run(app_id: str, request_id: str, gate: str,
                      input_files: list[dict], flags: list[dict],
                      plan_ids: dict | None = None) -> None:
    try:
        await asyncio.wait_for(_pipeline(app_id, request_id, gate, input_files, flags, plan_ids),
                               timeout=config.RUN_TIMEOUT_S)
    except Exception as e:  # noqa: BLE001 — every failure reverts the portal state honestly
        reason = f"{type(e).__name__}: {e}" if not isinstance(e, asyncio.TimeoutError) else \
            f"run exceeded {config.RUN_TIMEOUT_S}s timeout"
        traceback.print_exc()
        try:
            await portal.post_run_failed(app_id, request_id, reason)
        except Exception:  # noqa: BLE001
            traceback.print_exc()


def _exclusions(flags: list[dict]) -> dict[tuple[str, int], str]:
    """(fileId, page) -> reason, for pages barred from any span. Deterministic
    pre-flight codes ONLY (blank / duplicate) — never model judgments;
    low_contrast / low_dpi do not exclude. The duplicate's ORIGINAL page stays."""
    out: dict[tuple[str, int], str] = {}
    for f in flags:
        if f.get("code") in ("blank", "duplicate") and f.get("page") and f.get("fileId"):
            out[(f["fileId"], int(f["page"]))] = f.get("note") or f["code"]
    return out


def _flag_touches(flag: dict, file_id: str, first: int, last: int) -> bool:
    if flag.get("fileId") != file_id:
        return False
    page = flag.get("page")
    return page is None or first <= int(page) <= last


async def _pipeline(app_id: str, request_id: str, gate: str,
                    input_files: list[dict], pf_flags: list[dict],
                    plan_ids: dict | None) -> None:
    # Resolve the per-run model plan FIRST — unknown/unavailable options fail
    # loudly here, before any spend (never a silent engine substitution).
    plan = resolve_plan(plan_ids)

    app = await portal.get_application(app_id)
    run_state = app.get("run") or {}
    if run_state.get("requestId") != request_id:
        raise RuntimeError("run request superseded since this run was kicked")
    if not input_files:
        raise RuntimeError("run kicked with an empty input set")

    now = datetime.datetime.now(datetime.timezone.utc)
    run_id = f"run-{now:%Y%m%d-%H%M%S}-{secrets.token_hex(2)}"
    store = Path(config.STORE_DIR) / app_id / run_id
    store.mkdir(parents=True, exist_ok=True)
    ref = f"store://{app_id}/{run_id}"
    run_config = {
        "pipelineVersion": plan.pipeline_version(),
        "spec": "homium-analyzer-spec-v0.7",
        "plan": plan.ids,
        "parse": {"backend": plan.parse.backend, "model": plan.parse.model},
        "judge": {"backend": plan.judge.backend, "model": plan.judge.model},
        "text": {"backend": plan.text.backend, "model": plan.text.model},
        "judgePromptVersion": judge_prompt_version(plan.fraud_scoring),
        "fraudScoring": plan.fraud_scoring,
        "renderDpi": config.RENDER_DPI,
        "gate": gate,
        "requestId": request_id,
        "input": input_files,
    }
    (store / "config.json").write_text(json.dumps(run_config, indent=2))
    timings = {"renderMs": 0, "parseMs": 0, "splitClassifyMs": 0, "judgeMs": 0, "totalMs": 0}
    t_run = time.monotonic()

    # ── per-file fetch / render / parse; then one global reading order ──────
    # sheet[i] = {"fileId", "page" (1-based in-file), "png", "md"} — reading
    # order is the input set's order (receipt order), pages in order per file.
    sheet: list[dict] = []
    file_starts: set[int] = set()  # global 0-based indices that begin a file
    for f in input_files:
        file_id = f["fileId"]
        fdir = store / "files" / file_id
        pdf_path = fdir / "source.pdf"
        fdir.mkdir(parents=True, exist_ok=True)
        pdf_path.write_bytes(await portal.get_source_file(app_id, file_id))

        t = time.monotonic()
        # Page renders are keyed by FILE, not run: files are immutable, so a
        # render never changes — and thumbnails survive across (delta) runs.
        pngs = await render_pages(str(pdf_path), str(Path(config.STORE_DIR) / app_id / "files" / file_id / "pages"))
        timings["renderMs"] += int((time.monotonic() - t) * 1000)
        if len(pngs) != f.get("pages"):
            raise RuntimeError(f"{f.get('filename', file_id)}: rendered {len(pngs)} pages, "
                               f"registry says {f.get('pages')}")
        t = time.monotonic()
        # md/elements are file-keyed like the page renders: each file is parsed
        # exactly once (by the run that covers it), so the parse is run-independent
        # and stays fetchable after later delta runs.
        mds = await parse_document(pngs, str(Path(config.STORE_DIR) / app_id / "files" / file_id / "md"), plan.parse, str(pdf_path))
        timings["parseMs"] += int((time.monotonic() - t) * 1000)

        file_starts.add(len(sheet))
        for i, (png, md) in enumerate(zip(pngs, mds)):
            sheet.append({"fileId": file_id, "page": i + 1, "png": png, "md": md})

    all_mds = [s["md"] for s in sheet]
    t = time.monotonic()
    starts = await llm_refine_boundaries(all_mds, deterministic_boundaries(all_mds), plan.text)
    # A file boundary is ALWAYS a document boundary — spans never cross files.
    starts = sorted(set(starts) | file_starts)
    # Span-gluing rule (v0.7): pages the deterministic pre-flight called blank/
    # duplicate never join a span — they surface below as visible junk in
    # unassigned, never silently dropped.
    exclusions = _exclusions(pf_flags)
    excluded_idx = {i for i, s in enumerate(sheet) if (s["fileId"], s["page"]) in exclusions}
    segments = to_segments(starts, len(sheet), excluded_pages={i + 1 for i in excluded_idx})
    timings["splitClassifyMs"] += int((time.monotonic() - t) * 1000)

    def span_of(first: int, last: int) -> dict:
        """Global 1-based [first,last] (guaranteed within one file) -> FileSpan."""
        a, b = sheet[first - 1], sheet[last - 1]
        if a["fileId"] != b["fileId"]:
            raise RuntimeError("segment crosses a file boundary — split/glue bug")
        return {"fileId": a["fileId"], "pages": [a["page"], b["page"]]}

    blocks_by_id = block_index(app["template"])
    blocks = list(blocks_by_id.values())
    claimed: set[str] = set()
    taken_names: set[str] = set()
    documents: list[dict] = []
    unassigned: list[dict] = []
    for i in sorted(excluded_idx):  # junk stays VISIBLE — file or archive it, never a silent drop
        s = sheet[i]
        unassigned.append({"span": {"fileId": s["fileId"], "pages": [s["page"], s["page"]]},
                           "description": f"Pre-flight junk ({exclusions[(s['fileId'], s['page'])]}) — excluded "
                                          f"from document spans; kept visible to file or archive."})

    doc_pad = max(2, len(str(len(segments))))
    for first, last in segments:
        span = span_of(first, last)
        file_id = span["fileId"]
        seg_md = sheet[first - 1]["md"]
        t = time.monotonic()
        tax_id, desc = await classify_segment(seg_md, plan.text)
        timings["splitClassifyMs"] += int((time.monotonic() - t) * 1000)
        block_id = map_to_block(tax_id, blocks, claimed) if tax_id != "unassigned" else None
        if block_id is None:
            unassigned.append({"span": span, "description": desc})
            continue
        claimed.add(block_id)
        block = blocks_by_id[block_id]

        seg_pngs = [sheet[first - 1]["png"]] + ([sheet[last - 1]["png"]] if last > first else [])
        seg_flags = [f.get("note") or f.get("code", "")
                     for f in pf_flags if _flag_touches(f, file_id, span["pages"][0], span["pages"][1])]
        t = time.monotonic()
        verdict, judge_meta = await judge_document(TAXONOMY[tax_id]["display"], seg_md, seg_pngs, seg_flags,
                                                   plan.judge, fraud_scoring=plan.fraud_scoring)
        timings["judgeMs"] += int((time.monotonic() - t) * 1000)

        doc_index = len(documents) + 1
        confidence = 0.9 if block.get("docType") == tax_id else 0.7
        judge_rel = f"judge/doc-{doc_index:0{doc_pad}d}.json"
        (store / "judge").mkdir(exist_ok=True)
        with open(store / judge_rel, "x", encoding="utf-8") as jf:
            json.dump({
                "docIndex": doc_index,
                "span": span,
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
        pad = len(str(next(f["pages"] for f in input_files if f["fileId"] == file_id)))
        documents.append({
            "spans": [span],
            "suggestedBlockId": block_id,
            "confidence": confidence,
            "suggestedName": derive_name(core["document_date"], block_id, core.get("issuing_party"),
                                         core["primary_party_name"], taken_names),
            "coreFields": core,
            "scores": {
                "quality": verdict["quality"],
                "formatting": verdict["formatting"],
                **({"fraud_signal": verdict["fraud_signal"]} if "fraud_signal" in verdict else {}),
                "scrutinyTier": block.get("criticality") or "standard",
            },
            "flags": verdict["flags"],
            "extractions": [],
            "artifacts": {
                "judge": f"{ref}/{judge_rel}",
                "md": f"store://{app_id}/files/{file_id}/md/p{span['pages'][0]}.md",
                # pdftoppm zero-pads to the FILE's page-count width — the URIs
                # must reference the files as they exist on disk. Renders are
                # file-keyed (run-independent).
                "pageRenders": [f"store://{app_id}/files/{file_id}/pages/p-{n:0{pad}d}.png"
                                for n in range(span["pages"][0], span["pages"][1] + 1)],
                "crops": [],
            },
        })

    apply_substitution_scrutiny(documents, app["template"], blocks_by_id)
    whisper = [f"Split {len(sheet)} pages across {len(input_files)} file(s) into {len(documents)} documents; "
               f"{len(unassigned)} unassigned; {sum(1 for d in documents if d['flags'])} flagged."]
    if excluded_idx:
        whisper.append("Span-gluing: excluded from spans: "
                       + ", ".join(f"{fid} p.{p} ({r})" for (fid, p), r in sorted(exclusions.items())) + ".")
    scan_reasons = needs_deep_scan(documents, blocks_by_id)
    if scan_reasons:
        findings = deep_scan(documents, app.get("applicantName", ""))
        whisper.append(f"Deep scan ({'; '.join(scan_reasons[:2])}): "
                       f"{len(findings)} cross-document finding(s)." if findings else
                       f"Deep scan ({'; '.join(scan_reasons[:2])}): no cross-document inconsistencies.")
    for d in documents:
        d.pop("_substituted_critical", None)

    # satisfaction pass (Phase 4): set blocks with documents get an expert read
    t = time.monotonic()
    satisfaction, sat_whispers = await satisfaction_pass(app, blocks_by_id, documents, store, plan.text)
    timings["satisfactionMs"] = int((time.monotonic() - t) * 1000)
    whisper.extend(sat_whispers)

    timings["totalMs"] = int((time.monotonic() - t_run) * 1000)
    files_root = Path(config.STORE_DIR) / app_id / "files"
    artifacts_produced = {
        "md": True,
        "elements": any((files_root / f["fileId"] / "elements").is_dir()
                        and any((files_root / f["fileId"] / "elements").iterdir())
                        for f in input_files),
        "crops": False,
    }
    run_config["timings"] = timings
    run_config["artifactsProduced"] = artifacts_produced
    (store / "config.json").write_text(json.dumps(run_config, indent=2))

    run = {
        "runId": run_id,
        "requestId": request_id,
        "startedAt": now.isoformat().replace("+00:00", "Z"),
        "pipelineVersion": plan.pipeline_version(),
        "fraudScoring": plan.fraud_scoring,
        "durationMs": timings["totalMs"],
        "artifactsProduced": artifacts_produced,
        "input": input_files,
        "preflight": {"pages": len(sheet), "flags": pf_flags, "gate": gate},
        "documents": documents,
        "unassigned": unassigned,
        **({"satisfaction": satisfaction} if satisfaction else {}),
        "whisper": whisper,
    }
    status, body = await portal.post_run(app_id, run)
    if status != 201:
        raise RuntimeError(f"portal rejected the run ({status}): {body}")
