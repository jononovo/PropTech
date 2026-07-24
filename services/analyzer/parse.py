"""parse_document() — the single parser interface (spec §1.1). The engine is
chosen PER RUN (models.ModelChoice, resolved from the run plan); env config is
only the default. Swapping engines is config/plan, never code."""
import asyncio
from pathlib import Path

from config import PARSE_CONCURRENCY
from llm import chat
from models import ModelChoice

PROMPT = (
    "Transcribe this scanned document page into clean markdown.\n"
    "- Preserve headings, printed form IDs (e.g. 'Form 1003', 'W-2', '4506-C'), labels and values.\n"
    "- Render tables as markdown tables. Keep 'Page X of Y' footers if printed.\n"
    "- Mark unreadable regions as (illegible). Do NOT invent text.\n"
    "Output ONLY the markdown."
)


async def parse_document(page_pngs: list[str], md_dir: str, choice: ModelChoice, pdf_path: str) -> list[str]:
    """Page image -> markdown, concurrently but politely. Saves p<N>.md artifacts.
    pdf_path: the whole-packet PDF for document-native backends (mistral)."""
    if choice.backend == "paddle":
        from paddle_parse import parse_pages_paddle  # deferred: heavy import chain

        return await parse_pages_paddle(page_pngs, md_dir, choice)
    if choice.backend == "mistral":
        from mistral_ocr_parse import parse_packet_with_mistral_ocr

        return await parse_packet_with_mistral_ocr(pdf_path, len(page_pngs), md_dir, choice)
    Path(md_dir).mkdir(parents=True, exist_ok=True)
    sem = asyncio.Semaphore(PARSE_CONCURRENCY)

    async def one(i: int, png: str) -> str:
        async with sem:
            md = await chat(choice.backend, choice.model, PROMPT, [png], max_tokens=3000,
                            base_url=choice.base_url, api_key=choice.api_key)
        Path(md_dir, f"p{i + 1}.md").write_text(md)
        return md

    return list(await asyncio.gather(*(one(i, p) for i, p in enumerate(page_pngs))))
