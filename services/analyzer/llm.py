"""One thin model layer, two backends (fireworks = OpenAI-compatible,
anthropic = messages API). Every caller goes through chat() so swapping an
engine is config, never code. Retries with backoff on 429/5xx/network."""
import asyncio
import base64
import json

import httpx

from config import ANTHROPIC_API_KEY, ANTHROPIC_BASE, FIREWORKS_API_KEY, FIREWORKS_BASE

RETRIES = 3


def _img_b64(path: str) -> str:
    with open(path, "rb") as f:
        return base64.b64encode(f.read()).decode()


async def _openai_compat(base: str, key: str, model: str, prompt: str, image_paths: list[str], max_tokens: int) -> str:
    """Any OpenAI-compatible chat endpoint (Fireworks, Novita, ...)."""
    content: list[dict] = [{"type": "text", "text": prompt}]
    for p in image_paths:
        content.append({"type": "image_url", "image_url": {"url": f"data:image/png;base64,{_img_b64(p)}"}})
    async with httpx.AsyncClient(timeout=httpx.Timeout(30.0, read=180.0)) as c:
        r = await c.post(
            f"{base.rstrip('/')}/chat/completions",
            headers={"Authorization": f"Bearer {key}"},
            json={"model": model, "max_tokens": max_tokens, "messages": [{"role": "user", "content": content}]},
        )
        if r.status_code >= 400:
            raise RuntimeError(f"{model.rsplit('/', 1)[-1]} @ {base} -> {r.status_code}: {r.text[:200]}")
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


async def chat(backend: str, model: str, prompt: str, image_paths: list[str] | None = None,
               max_tokens: int = 4096, base_url: str = "", api_key: str = "") -> str:
    """backend: anthropic | fireworks | openai (generic OpenAI-compatible —
    requires base_url + api_key, e.g. Novita)."""
    last: Exception | None = None
    for attempt in range(RETRIES):
        try:
            if backend == "anthropic":
                return await _anthropic(model, prompt, image_paths or [], max_tokens)
            if backend == "openai":
                if not base_url or not api_key:
                    raise RuntimeError(f"openai-compatible backend needs base_url+api_key (model {model})")
                return await _openai_compat(base_url, api_key, model, prompt, image_paths or [], max_tokens)
            return await _openai_compat(FIREWORKS_BASE, FIREWORKS_API_KEY, model, prompt, image_paths or [], max_tokens)
        except Exception as e:  # noqa: BLE001 — retried, then surfaced honestly
            last = e
            await asyncio.sleep(2 ** attempt)
    raise RuntimeError(f"model call failed after {RETRIES} attempts: {last}")


def extract_json(text: str, required_keys: tuple[str, ...] = ()) -> dict:
    """Models wrap JSON in prose, fences, and reasoning that may itself contain
    braces — a greedy first-{-to-last-} regex breaks on that ("Extra data").
    Instead: scan for every parseable object via raw_decode and keep the LAST one
    carrying required_keys (reasoning models emit the answer last). Fail loudly
    when nothing qualifies."""
    dec = json.JSONDecoder()
    best: dict | None = None
    i = text.find("{")
    while i != -1:
        try:
            obj, end = dec.raw_decode(text, i)
            if isinstance(obj, dict) and all(k in obj for k in required_keys):
                best = obj
            i = text.find("{", max(end, i + 1))
        except ValueError:
            i = text.find("{", i + 1)
    if best is None:
        raise ValueError(f"no JSON object with keys {list(required_keys)} in model output: {text[:200]}")
    return best
