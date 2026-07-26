"""Page rendering via poppler (pdftoppm) — no image 'enhancement' is ever
applied before parsing (spec §3: gate, don't retouch)."""
import asyncio
import os
from pathlib import Path

from config import RENDER_DPI


async def render_pages(pdf_path: str, out_dir: str) -> list[str]:
    """Render every page to PNG. Returns paths ordered by page number (1-based order)."""
    Path(out_dir).mkdir(parents=True, exist_ok=True)
    prefix = os.path.join(out_dir, "p")
    proc = await asyncio.create_subprocess_exec(
        "pdftoppm", "-png", "-r", str(RENDER_DPI), pdf_path, prefix,
        stdout=asyncio.subprocess.PIPE, stderr=asyncio.subprocess.PIPE,
    )
    _, err = await proc.communicate()
    if proc.returncode != 0:
        raise RuntimeError(f"pdftoppm failed: {err.decode()[:300]}")
    pages = sorted(Path(out_dir).glob("p-*.png"), key=lambda p: int(p.stem.split("-")[-1]))
    if not pages:
        raise RuntimeError("pdftoppm produced no pages")
    return [str(p) for p in pages]


THUMBNAIL_WIDTH = 320  # filmstrip width — generated alongside the full render


def make_thumbnail(src: str, dest: str) -> str:
    """320px-wide PNG thumbnail of one rendered page."""
    from PIL import Image

    Path(dest).parent.mkdir(parents=True, exist_ok=True)
    with Image.open(src) as im:
        h = max(1, round(im.height * THUMBNAIL_WIDTH / im.width))
        im.convert("RGB").resize((THUMBNAIL_WIDTH, h)).save(dest, "PNG", optimize=True)
    return dest
