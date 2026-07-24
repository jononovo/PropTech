"""parse_document() — the single parser interface (spec §1.1). The locked
target engine is PaddleOCR-VL 1.6 self-hosted; until that endpoint exists the
backend is a hosted VLM, and swapping is config (PARSE_BACKEND/PARSE_MODEL)."""
import asyncio
from pathlib import Path

from config import PARSE_BACKEND, PARSE_CONCURRENCY, PARSE_MODEL
from llm import chat

PROMPT = (
    "Transcribe this scanned document page into clean markdown.\n"
    "- Preserve headings, printed form IDs (e.g. 'Form 1003', 'W-2', '4506-C'), labels and values.\n"
    "- Render tables as markdown tables. Keep 'Page X of Y' footers if printed.\n"
    "- Mark unreadable regions as (illegible). Do NOT invent text.\n"
    "Output ONLY the markdown."
)


async def parse_document(page_pngs: list[str], md_dir: str) -> list[str]:
    """Page image -> markdown, concurrently but politely. Saves p<N>.md artifacts."""
    if PARSE_BACKEND == "paddle":
        from paddle_parse import parse_pages_paddle  # deferred: heavy import chain

        return await parse_pages_paddle(page_pngs, md_dir)
    Path(md_dir).mkdir(parents=True, exist_ok=True)
    sem = asyncio.Semaphore(PARSE_CONCURRENCY)

    async def one(i: int, png: str) -> str:
        async with sem:
            md = await chat(PARSE_BACKEND, PARSE_MODEL, PROMPT, [png], max_tokens=3000)
        Path(md_dir, f"p{i + 1}.md").write_text(md)
        return md

    return list(await asyncio.gather(*(one(i, p) for i, p in enumerate(page_pngs))))
