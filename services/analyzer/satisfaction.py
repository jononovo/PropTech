"""Satisfaction pass (Phase 4) — a text-LLM read of SET blocks after filing.

For every set block that got at least one document this run, ask the text model
to organize those documents into variant-shaped piles, compare against the
deal's declared variants and the author's analysisNote, and say plainly what is
covered and what is missing. Structured inputs only (names, coreFields, flags,
pages) — the pass never re-reads page markdown or images; that work already
happened upstream.

Assistive, never a gate: humans re-assign freely and the portal must not block
anything on this output. A per-block failure is reported in the run whisper
(visible, not silent) and the block is omitted — one broken assist must not
burn an otherwise good run.
"""
from __future__ import annotations

import datetime
import json
from pathlib import Path

from llm import chat, extract_json
from models import ModelChoice

PROMPT = """You are a senior lending operations analyst. A document requirement of type "set" \
is satisfied by N variants (e.g. one pile of statements per bank account), each variant needing \
its own documents. Below: the requirement's rules, the variants the deal declared, and the \
documents the analyzer filed under it this run (structured fields only).

REQUIREMENT
{block_json}

DECLARED VARIANTS (may be empty — the deal may not have declared them yet)
{variants_json}

FILED DOCUMENTS
{docs_json}

Organize the filed documents into variant-shaped piles and judge coverage. Reply with ONLY a JSON object:
{{
  "groups": [{{
     "variantId": "declared variant id this pile belongs to — omit if you cannot tell",
     "descriptorGuess": {{"<descriptorField>": "value you read off the documents"}},
     "docPages": [[first,last], ...],
     "coverage": "one sentence on sequence coverage (periods present, holes) — omit if not applicable"
  }}],
  "gaps": ["what is still missing, one plain sentence each — empty list if nothing obvious"],
  "summary": "one short paragraph: the expert read of where this requirement stands"
}}
Rules: every filed document appears in exactly one group's docPages. Never invent variantIds — \
only use declared ones. Follow the requirement's analysisNote where present. Be concrete \
(names, months, counts), not hedgy."""


async def satisfaction_pass(app: dict, blocks_by_id: dict[str, dict], documents: list[dict],
                            store: Path, text: ModelChoice) -> tuple[dict[str, dict], list[str]]:
    """Returns ({blockId: BlockSatisfaction}, whisper_lines)."""
    out: dict[str, dict] = {}
    whispers: list[str] = []
    declared = app.get("variants") or {}
    by_block: dict[str, list[dict]] = {}
    for d in documents:
        by_block.setdefault(d["suggestedBlockId"], []).append(d)

    for block_id, docs in by_block.items():
        block = blocks_by_id.get(block_id) or {}
        if block.get("arity") != "set":
            continue
        block_view = {k: block[k] for k in ("name", "docType", "arity", "variantConfig", "analysisNote")
                      if k in block}
        docs_view = [{
            "spans": d["spans"],
            "suggestedName": d["suggestedName"],
            "coreFields": d["coreFields"],
            "flags": d["flags"],
        } for d in docs]
        prompt = PROMPT.format(
            block_json=json.dumps(block_view, indent=2),
            variants_json=json.dumps(declared.get(block_id) or [], indent=2),
            docs_json=json.dumps(docs_view, indent=2),
        )
        try:
            raw = await chat(text.backend, text.model, prompt,
                             base_url=text.base_url, api_key=text.api_key)
            parsed = extract_json(raw, required_keys=("groups", "gaps", "summary"))
            result = {
                "groups": parsed["groups"],
                "gaps": parsed["gaps"],
                "summary": parsed["summary"],
                "model": text.model,
                "generatedAt": datetime.datetime.now(datetime.timezone.utc)
                    .isoformat().replace("+00:00", "Z"),
            }
        except Exception as e:  # noqa: BLE001 — visible-not-silent: whisper it, keep the run
            whispers.append(f"Satisfaction pass FAILED for {block_id}: {type(e).__name__}: {e}")
            continue
        sat_dir = store / "satisfaction"
        sat_dir.mkdir(exist_ok=True)
        # write-once audit copy alongside the run's other artifacts
        with open(sat_dir / f"block-{block_id}.json", "x", encoding="utf-8") as f:
            json.dump({**result, "prompt": prompt, "raw": raw}, f, indent=2)
        out[block_id] = result
    if out:
        whispers.append("Satisfaction pass: " + "; ".join(
            f"{b} — {len(r['groups'])} pile(s), {len(r['gaps'])} gap(s)" for b, r in out.items()) + ".")
    return out, whispers
