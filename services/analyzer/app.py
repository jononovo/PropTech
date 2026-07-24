"""Analyzer worker — kicked by the portal, answers 202 immediately, does the
work in the background, and reports back ONLY through the portal API:
POST /analysis on success, POST /packet/run-failed on any failure (spec §5)."""
import asyncio
from typing import Literal

from fastapi import BackgroundTasks, FastAPI, HTTPException
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
    plan: dict[str, str] | None = None  # per-stage model option ids (parse/text/judge)


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
