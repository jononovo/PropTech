"""The portal API is the analyzer's ONLY integration surface (spec §5) — the
analyzer stays stateless toward the portal and never touches its storage."""
import asyncio
from pathlib import Path

import httpx

from config import PORTAL_API_BASE


def _client() -> httpx.AsyncClient:
    # The service identity header exempts worker loopback traffic from the
    # portal's access matrix (which authorizes humans via x-profile).
    return httpx.AsyncClient(
        base_url=PORTAL_API_BASE,
        timeout=httpx.Timeout(60.0, read=120.0),
        headers={"x-sheaf-service": "analyzer-worker"},
    )


async def get_application(app_id: str) -> dict:
    async with _client() as c:
        r = await c.get(f"/applications/{app_id}")
        r.raise_for_status()
        return r.json()


async def get_source_file(app_id: str, file_id: str) -> bytes:
    """One SourceFile's immutable bytes from the registry (file-native runs)."""
    async with _client() as c:
        r = await c.get(f"/applications/{app_id}/files/{file_id}")
        r.raise_for_status()
        return r.content


_ARTIFACT_TYPE = {
    "pages": "image/png",
    "thumbnails": "image/png",
    "md": "text/markdown",
    # octet-stream on the wire — the portal's JSON body parser must not eat it;
    # the stored object still gets application/json from the server-side map.
    "elements": "application/octet-stream",
}


async def put_file_artifacts(app_id: str, file_id: str, artifacts: dict[str, list[str]]) -> None:
    """Push one file's per-page artifacts (renders, thumbnails, parse md,
    layout elements) into the portal's object storage the moment they exist —
    the worker's disk is scratch, object storage is the single durable home
    (ruled Jul 26 2026). `artifacts` maps kind -> paths ordered by page."""
    sem = asyncio.Semaphore(6)

    async def put(c: httpx.AsyncClient, kind: str, page: int, path: str) -> None:
        async with sem:
            r = await c.put(
                f"/applications/{app_id}/files/{file_id}/artifacts/{page}",
                params={"kind": kind},
                # blank pages parse to an empty transcript — send a newline so
                # the object exists (the portal rejects bodyless PUTs)
                content=Path(path).read_bytes() or b"\n",
                headers={"content-type": _ARTIFACT_TYPE[kind]},
            )
            r.raise_for_status()

    async with _client() as c:
        await asyncio.gather(
            *(put(c, kind, i + 1, p)
              for kind, paths in artifacts.items()
              for i, p in enumerate(paths)),
        )


async def post_run(app_id: str, run: dict) -> tuple[int, str]:
    """Single-run POST — the portal appends and owns latestRunId (spec §5)."""
    async with _client() as c:
        r = await c.post(f"/applications/{app_id}/analysis", json=run)
        return r.status_code, r.text[:500]


async def post_run_failed(app_id: str, request_id: str, reason: str) -> int:
    """Honest failure callback — the run must never hang in processing."""
    async with _client() as c:
        r = await c.post(
            f"/applications/{app_id}/run/failed",
            json={"reason": reason[:500], "requestId": request_id},
        )
        return r.status_code
