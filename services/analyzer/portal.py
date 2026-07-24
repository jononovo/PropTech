"""The portal API is the analyzer's ONLY integration surface (spec §5) — the
analyzer stays stateless toward the portal and never touches its storage."""
import httpx

from config import PORTAL_API_BASE


def _client() -> httpx.AsyncClient:
    return httpx.AsyncClient(base_url=PORTAL_API_BASE, timeout=httpx.Timeout(60.0, read=120.0))


async def get_application(app_id: str) -> dict:
    async with _client() as c:
        r = await c.get(f"/applications/{app_id}")
        r.raise_for_status()
        return r.json()


async def get_packet_pdf(app_id: str) -> bytes:
    async with _client() as c:
        r = await c.get(f"/applications/{app_id}/packet/file")
        r.raise_for_status()
        return r.content


async def post_run(app_id: str, run: dict) -> tuple[int, str]:
    """Single-run POST — the portal appends and owns latestRunId (spec §5)."""
    async with _client() as c:
        r = await c.post(f"/applications/{app_id}/analysis", json=run)
        return r.status_code, r.text[:500]


async def post_run_failed(app_id: str, packet_sha256: str, reason: str) -> int:
    """Honest failure callback — the packet must never hang in processing."""
    async with _client() as c:
        r = await c.post(
            f"/applications/{app_id}/packet/run-failed",
            json={"reason": reason[:500], "packetSha256": packet_sha256},
        )
        return r.status_code
