"""Readiness gate for the scale-to-zero VL deployment (PaddleOCR-VL on Fireworks).

The dedicated deployment scales to zero after idle; the first inference request
then gets 503 DEPLOYMENT_SCALING_UP while a replica boots — measured 10+ minutes
on 2026-07-24 — and paddlex's vlm worker treats any error as fatal, killing the
run. This module turns a cold start into a bounded wait: probe with a 1-token
completion until the deployment serves, then let the parse begin.

The probe is a readiness check only — parsing stays exclusively inside the
paddleocr pipeline (spec §1.1); this never parses anything.

Failure semantics match the engine's: not ready in time → raise loudly."""
import asyncio
import time

import httpx

import config


class VLDeploymentNotReady(RuntimeError):
    """The VL deployment did not serve within the readiness window."""


def _is_scaling_up(status: int, body: str) -> bool:
    return status == 503 and "DEPLOYMENT_SCALING_UP" in body


async def _probe_once(client: httpx.AsyncClient, base_url: str, model: str, api_key: str) -> tuple[int, str]:
    resp = await client.post(
        f"{base_url.rstrip('/')}/chat/completions",
        headers={"Authorization": f"Bearer {api_key}"},
        json={"model": model, "max_tokens": 1, "messages": [{"role": "user", "content": "."}]},
    )
    return resp.status_code, resp.text


async def ensure_vl_ready(
    *,
    base_url: str | None = None,
    model: str | None = None,
    api_key: str | None = None,
    poll_s: float | None = None,
    timeout_s: float | None = None,
) -> float:
    """Block until the VL deployment answers a 1-token completion. Returns the
    seconds waited (0.0 when already warm).

    Retries only the two cold-start signatures — 503 DEPLOYMENT_SCALING_UP and
    transport errors — until `timeout_s`. Any other response is a real
    configuration/auth problem and raises immediately (fail fast, no masking)."""
    base_url = base_url if base_url is not None else config.PADDLE_VL_URL
    model = model if model is not None else config.PADDLE_VL_MODEL
    api_key = api_key if api_key is not None else config.FIREWORKS_API_KEY
    poll_s = poll_s if poll_s is not None else config.VL_READY_POLL_S
    timeout_s = timeout_s if timeout_s is not None else config.VL_READY_TIMEOUT_S

    started = time.monotonic()
    deadline = started + timeout_s
    last_detail = ""
    cold = False  # flips on the first cold-start signature; 0.0 means "was warm"

    async with httpx.AsyncClient(timeout=30.0) as client:
        while True:
            try:
                status, body = await _probe_once(client, base_url, model, api_key)
                if status == 200:
                    return round(time.monotonic() - started, 1) if cold else 0.0
                if not _is_scaling_up(status, body):
                    raise RuntimeError(f"VL readiness probe got HTTP {status} (not a cold start): {body[:300]}")
                last_detail = "503 DEPLOYMENT_SCALING_UP"
            except httpx.TransportError as e:  # boot-time resets/timeouts are retryable
                last_detail = f"transport error: {e}"

            if not cold:
                print(f"vl_ready: deployment cold ({last_detail}) — polling every {poll_s}s "
                      f"up to {timeout_s}s", flush=True)
                cold = True
            if time.monotonic() + poll_s > deadline:
                raise VLDeploymentNotReady(
                    f"VL deployment not ready after {int(time.monotonic() - started)}s "
                    f"(last: {last_detail}) — it may still be scaling up; retry the run shortly"
                )
            await asyncio.sleep(poll_s)
