"""Analyzer worker — kicked by the portal, answers 202 immediately, does the
work in the background, and reports back ONLY through the portal API:
POST /analysis on success, POST /packet/run-failed on any failure (spec §5).
Also serves run artifacts (page renders) from its store — read-only."""
import asyncio
import re
from pathlib import Path
from typing import Literal

from fastapi import BackgroundTasks, FastAPI, HTTPException
from fastapi.responses import FileResponse
from pydantic import BaseModel

import config
from runner import execute_run

app = FastAPI(title="Sheaf Analyzer", version="0.1")
_running: set[str] = set()
_lock = asyncio.Lock()


class RunRequest(BaseModel):
    applicationId: str
    packetSha256: str
    gate: Literal["auto", "confirmed", "bypassed"]
    plan: dict[str, str | bool] | None = None  # per-stage model option ids (parse/text/judge) + plan toggles (fraudScoring: bool)


@app.get("/models")
async def models() -> dict:
    """Per-stage model options + availability — the registry the portal's
    dropdowns proxy. Single source of truth lives here, next to the engines."""
    import models as registry
    return registry.list_options()


@app.get("/health")
async def health() -> dict:
    return {
        "ok": True,
        "pipeline": config.PIPELINE_VERSION,
        "backendProblems": config.missing_backends(),
        "runningApplications": sorted(_running),
    }


_SAFE_SEG = re.compile(r"^[A-Za-z0-9_-]+$")
_STRIP_WIDTH = 320  # filmstrip thumbnail width — cached alongside the full render


def _make_strip(src: Path, dest: Path) -> None:
    from PIL import Image

    dest.parent.mkdir(parents=True, exist_ok=True)
    with Image.open(src) as im:
        h = max(1, round(im.height * _STRIP_WIDTH / im.width))
        im.convert("RGB").resize((_STRIP_WIDTH, h)).save(dest, "PNG", optimize=True)


@app.get("/store/{application_id}/{run_id}/pages/{page}")
def run_page_image(application_id: str, run_id: str, page: int, size: str = "full") -> FileResponse:
    """Page render for a landed run (filmstrip review). pdftoppm zero-pads
    filenames to the packet's page-count width, so we probe the paddings."""
    if not (_SAFE_SEG.match(application_id) and _SAFE_SEG.match(run_id)):
        raise HTTPException(status_code=400, detail="Invalid path segment")
    if page < 1 or size not in ("full", "strip"):
        raise HTTPException(status_code=400, detail="Invalid page or size")
    pages_dir = Path(config.STORE_DIR) / application_id / run_id / "pages"
    src = next(
        (c for c in (pages_dir / f"p-{page:0{w}d}.png" for w in (1, 2, 3, 4)) if c.exists()),
        None,
    )
    if src is None:
        raise HTTPException(status_code=404, detail="Page render not found")
    if size == "full":
        return FileResponse(src, media_type="image/png")
    strip = pages_dir.parent / "pages_strip" / src.name
    if not strip.exists():
        _make_strip(src, strip)  # sync handler — FastAPI runs it in the threadpool
    return FileResponse(strip, media_type="image/png")


@app.get("/store/{application_id}/{run_id}/md/{page}")
def run_page_markdown(application_id: str, run_id: str, page: int) -> FileResponse:
    """Per-page parse markdown for a landed run — fetched by the portal at
    approval time to build the approved document's .md sidecar."""
    if not (_SAFE_SEG.match(application_id) and _SAFE_SEG.match(run_id)):
        raise HTTPException(status_code=400, detail="Invalid path segment")
    if page < 1:
        raise HTTPException(status_code=400, detail="Invalid page")
    src = Path(config.STORE_DIR) / application_id / run_id / "md" / f"p{page}.md"
    if not src.exists():
        raise HTTPException(status_code=404, detail="Page markdown not found")
    return FileResponse(src, media_type="text/markdown")


@app.post("/runs", status_code=202)
async def kick_run(req: RunRequest, background: BackgroundTasks) -> dict:
    async with _lock:
        if req.applicationId in _running:
            raise HTTPException(status_code=409, detail="A run is already in flight for this application")
        _running.add(req.applicationId)

    async def run_and_release() -> None:
        try:
            await execute_run(req.applicationId, req.packetSha256, req.gate, req.plan)
        finally:
            async with _lock:
                _running.discard(req.applicationId)

    background.add_task(run_and_release)
    return {"accepted": True}
