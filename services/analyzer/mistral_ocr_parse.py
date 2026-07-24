"""Mistral OCR parse backend (Document AI OCR processor, OCR 4).

ONE API call per packet: the whole PDF goes up base64-encoded, per-page
markdown comes back (docs.mistral.ai — Document AI / OCR Processor). Besides
the p<N>.md contract artifacts this saves, per page:
  - elements/p<N>.json — typed blocks with bounding boxes (include_blocks),
    same artifact slot the paddle backend fills, for split signals and crops.
  - page-level confidence scores inside that JSON (confidence_scores_granularity).

Failure semantics: page-count mismatch, HTTP error, or missing markdown raises —
a parse that did not happen must never look like one that did."""
import base64
import json
from pathlib import Path

import httpx


async def parse_packet_with_mistral_ocr(pdf_path: str, page_count: int, md_dir: str, choice) -> list[str]:
    """Whole-packet PDF -> per-page markdown list, p<N>.md + elements/p<N>.json saved.
    `choice` is a models.ModelChoice with backend='mistral' (base_url, api_key, model)."""
    if not choice.api_key:
        raise RuntimeError("mistral parse: MISTRAL_API_KEY missing")
    Path(md_dir).mkdir(parents=True, exist_ok=True)
    elements_dir = Path(md_dir).parent / "elements"
    elements_dir.mkdir(parents=True, exist_ok=True)

    pdf_b64 = base64.b64encode(Path(pdf_path).read_bytes()).decode()
    # Read timeout sized for whole-packet OCR in one request.
    async with httpx.AsyncClient(timeout=httpx.Timeout(30.0, read=600.0)) as client:
        response = await client.post(
            f"{choice.base_url.rstrip('/')}/v1/ocr",
            headers={"Authorization": f"Bearer {choice.api_key}"},
            json={
                "model": choice.model,
                "document": {
                    "type": "document_url",
                    "document_url": f"data:application/pdf;base64,{pdf_b64}",
                },
                "include_blocks": True,
                "confidence_scores_granularity": "page",
            },
        )
    if response.status_code >= 400:
        raise RuntimeError(f"mistral ocr {choice.model} -> {response.status_code}: {response.text[:300]}")

    pages = response.json().get("pages") or []
    if len(pages) != page_count:
        raise RuntimeError(f"mistral ocr: packet has {page_count} pages, response has {len(pages)}")

    markdowns: list[str] = []
    for page in sorted(pages, key=lambda p: p.get("index", 0)):
        page_number = int(page.get("index", 0)) + 1  # API index is 0-based
        markdown = page.get("markdown")
        if markdown is None:
            raise RuntimeError(f"mistral ocr: page {page_number} returned no markdown")
        Path(md_dir, f"p{page_number}.md").write_text(markdown)
        (elements_dir / f"p{page_number}.json").write_text(json.dumps({
            "source": "mistral-ocr",
            "blocks": page.get("blocks"),
            "confidenceScores": page.get("confidence_scores"),
            "dimensions": page.get("dimensions"),
        }, indent=2))
        markdowns.append(markdown)
    return markdowns
