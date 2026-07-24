"""One thin model layer, two backends (fireworks = OpenAI-compatible,
anthropic = messages API). Every caller goes through chat() so swapping an
engine is config, never code. Retries with backoff on 429/5xx/network."""
import asyncio
import base64
import json
import re

import httpx

from config import ANTHROPIC_API_KEY, ANTHROPIC_BASE, FIREWORKS_API_KEY, FIREWORKS_BASE

RETRIES = 3


def _img_b64(path: str) -> str:
    with open(path, "rb") as f:
        return base64.b64encode(f.read()).decode()


async def _fireworks(model: str, prompt: str, image_paths: list[str], max_tokens: int) -> str:
    content: list[dict] = [{"type": "text", "text": prompt}]
    for p in image_paths:
        content.append({"type": "image_url", "image_url": {"url": f"data:image/png;base64,{_img_b64(p)}"}})
    async with httpx.AsyncClient(timeout=httpx.Timeout(30.0, read=180.0)) as c:
        r = await c.post(
            f"{FIREWORKS_BASE}/chat/completions",
            headers={"Authorization": f"Bearer {FIREWORKS_API_KEY}"},
            json={"model": model, "max_tokens": max_tokens, "messages": [{"role": "user", "content": content}]},
        )
        if r.status_code >= 400:
            raise RuntimeError(f"fireworks {model.rsplit('/', 1)[-1]} -> {r.status_code}: {r.text[:200]}")
        return r.json()["choices"][0]["message"]["content"] or ""


async def _anthropic(model: str, prompt: str, image_paths: list[str], max_tokens: int) -> str:
    content: list[dict] = []
    for p in image_paths:
        content.append({"type": "image", "source": {"type": "base64", "media_type": "image/png", "data": _img_b64(p)}})
    content.append({"type": "text", "text": prompt})
    async with httpx.AsyncClient(timeout=httpx.Timeout(30.0, read=180.0)) as c:
        r = await c.post(
            f"{ANTHROPIC_BASE.rstrip('/')}/v1/messages",
            headers={"x-api-key": ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01"},
            json={"model": model, "max_tokens": max_tokens, "messages": [{"role": "user", "content": content}]},
        )
        if r.status_code >= 400:
            raise RuntimeError(f"anthropic {model} -> {r.status_code}: {r.text[:200]}")
        return "".join(b.get("text", "") for b in r.json().get("content", []) if b.get("type") == "text")


async def chat(backend: str, model: str, prompt: str, image_paths: list[str] | None = None, max_tokens: int = 4096) -> str:
    last: Exception | None = None
    for attempt in range(RETRIES):
        try:
            if backend == "anthropic":
                return await _anthropic(model, prompt, image_paths or [], max_tokens)
            return await _fireworks(model, prompt, image_paths or [], max_tokens)
        except Exception as e:  # noqa: BLE001 — retried, then surfaced honestly
            last = e
            await asyncio.sleep(2 ** attempt)
    raise RuntimeError(f"model call failed after {RETRIES} attempts: {last}")


def extract_json(text: str) -> dict:
    """Models wrap JSON in prose/fences — pull the outermost object, fail loudly otherwise."""
    m = re.search(r"\{.*\}", text, re.DOTALL)
    if not m:
        raise ValueError(f"no JSON object in model output: {text[:150]}")
    return json.loads(m.group(0))
