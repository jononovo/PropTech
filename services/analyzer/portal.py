"""The portal API is the analyzer's ONLY integration surface (spec §5) — the
analyzer stays stateless toward the portal and never touches its storage."""
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
