"""Split & classify (spec §2.4): deterministic boundary signals FIRST
(form IDs, 'Page 1 of Y' resets), one text-LLM pass for ambiguous boundaries,
then per-segment classification against the taxonomy. Output is a taxonomy id
or unassigned — never an invented category (§4)."""
import difflib
import json
import re

from llm import chat, extract_json
from models import ModelChoice
from taxonomy import FORM_ID_SIGNALS, TAXONOMY

PAGE_ONE = re.compile(r"page\s*1\s*(of|/)\s*\d+", re.IGNORECASE)


def signal_on_page(md: str) -> str | None:
    head = md[:1200]
    for literal, tax_id in FORM_ID_SIGNALS:
        if re.search(re.escape(literal), head, re.IGNORECASE):
            return tax_id
    return None


def deterministic_boundaries(mds: list[str]) -> list[int]:
    """0-based page indices that START a new document."""
    starts = {0}
    active: str | None = signal_on_page(mds[0]) if mds else None
    for i in range(1, len(mds)):
        sig = signal_on_page(mds[i])
        if PAGE_ONE.search(mds[i][:1500]):
            starts.add(i)
            active = sig
        elif sig is not None and sig != active:
            starts.add(i)
            active = sig
        elif sig is not None:
            active = sig
    return sorted(starts)


async def llm_refine_boundaries(mds: list[str], starts: list[int], text: ModelChoice) -> list[int]:
    """One text-model pass over per-page openings — catches boundaries with no
    printed signal (letters, statements). Deterministic starts are kept."""
    lines = [f"[page {i + 1}] {' '.join(md.split())[:200]}" for i, md in enumerate(mds)]
    prompt = (
        "These are the opening words of each page of one uploaded loan packet, in order.\n"
        "Deterministic signals already mark new documents starting at pages: "
        f"{[s + 1 for s in starts]}.\n"
        "List ANY ADDITIONAL pages that clearly start a new document (letterhead change, new "
        "statement period, new form). Be conservative — when unsure, do not split.\n"
        'Answer ONLY JSON: {"additional_starts": [pageNumbers]}\n\n' + "\n".join(lines)
    )
    try:
        out = extract_json(
            # Reasoning models (glm) think at length before the JSON — leave room,
            # or the answer never gets emitted and refinement silently no-ops.
            await chat(text.backend, text.model, prompt, max_tokens=4096,
                       base_url=text.base_url, api_key=text.api_key),
            required_keys=("additional_starts",),
        )
        extra = {int(p) - 1 for p in out.get("additional_starts", []) if 1 <= int(p) <= len(mds)}
    except Exception:  # noqa: BLE001 — refinement is additive; deterministic result stands
        extra = set()
    return sorted(set(starts) | extra)


def to_segments(starts: list[int], total: int,
                excluded_pages: set[int] | frozenset[int] = frozenset()) -> list[tuple[int, int]]:
    """1-based inclusive [first, last] page ranges over kept pages only.
    excluded_pages (1-based) are hard breaks: junk never joins a span, and a
    span interrupted by junk splits — [first, last] must never cover an
    excluded page (the segment contract has no holes)."""
    start_set = set(starts)
    out: list[list[int]] = []
    cur: list[int] | None = None
    for i in range(total):
        page = i + 1
        if page in excluded_pages:
            cur = None  # hard break — the next kept page starts a fresh span
            continue
        if cur is None or i in start_set:
            cur = [page, page]
            out.append(cur)
        else:
            cur[1] = page
    return [(a, b) for a, b in out]


async def classify_segment(seg_md: str, text: ModelChoice) -> tuple[str, str]:
    """-> (taxonomy id | 'unassigned', one-line description)."""
    menu = "\n".join(f"- {tid}: {t['display']} (hints: {', '.join(t['hints'][:3])})" for tid, t in TAXONOMY.items())
    prompt = (
        "Classify this document from a mortgage loan packet.\n"
        f"Valid types:\n{menu}\n\n"
        'Answer ONLY JSON: {"taxonomy_id": "<id or unassigned>", "description": "<one line, what this document is>"}\n'
        "Use unassigned when nothing fits — NEVER invent a type.\n\n"
        f"Document text (first page, parsed):\n{seg_md[:3000]}"
    )
    try:
        out = extract_json(
            await chat(text.backend, text.model, prompt, max_tokens=4096,
                       base_url=text.base_url, api_key=text.api_key),
            required_keys=("taxonomy_id",),
        )
        tid = str(out.get("taxonomy_id", "unassigned"))
        desc = str(out.get("description", ""))[:200] or "Unrecognized document"
    except ValueError as e:  # malformed model output -> honest unassigned; backend failures (RuntimeError) propagate to the run-failed path
        return "unassigned", f"Classification failed: {e}"[:200]
    return (tid if tid in TAXONOMY else "unassigned"), desc


def map_to_block(tax_id: str, blocks: list[dict], claimed: set[str]) -> str | None:
    """docType exact match first (v0.6.2), name-similarity fallback for untagged
    blocks. Prefers unclaimed blocks in template order; returns block id or None."""
    exact = [b for b in blocks if b.get("docType") == tax_id]
    for b in exact:
        if b["id"] not in claimed:
            return b["id"]
    if exact:
        return exact[0]["id"]
    display = TAXONOMY[tax_id]["display"].lower() if tax_id in TAXONOMY else tax_id
    best, best_score = None, 0.55
    for b in blocks:
        if b.get("docType"):
            continue  # tagged blocks only match exactly
        score = difflib.SequenceMatcher(None, b.get("name", "").lower(), display).ratio()
        if score > best_score and b["id"] not in claimed:
            best, best_score = b["id"], score
    return best
