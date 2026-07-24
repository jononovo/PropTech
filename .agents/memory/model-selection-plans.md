---
name: Per-run model plans
description: How per-run model selection works (worker registry, plan resolution honesty rule) and why every packet gates.
---

# Per-run model plans (built Jul 24, 2026)

- Single source of truth for per-stage engine options = the WORKER registry (`services/analyzer/models.py`). Portal `GET /api/models/options` is a verbatim proxy; dropdowns can never drift from what the worker runs.
- **Honesty rule:** plan option ids resolve at run start; unknown/unavailable → run fails loudly. Never silently substitute an engine. Resolved plan + per-run pipelineVersion are frozen into the run's `config.json`.
- Env config (`PARSE_BACKEND` etc.) is only the system default now; plan > env.
- Spec §3 auto-proceed (<20 clean pages) is SUSPENDED deliberately — every packet gates so staff pick the plan. Restore = flip `auto` back in packet router.
- Paddle subprocess gets its VL endpoint/model/key/pipeline_version via env vars (`PADDLE_VL_URL/MODEL/KEY`, `PADDLE_PIPELINE_VERSION`) passed by the parent — the CLI has no other channel.
- `llm.py chat()` backends: anthropic | fireworks | openai (generic OpenAI-compatible, needs base_url+api_key — Novita). Mistral OCR is NOT chat-shaped: separate document-API adapter (`mistral_ocr_parse.py`, one call per packet, 0-based page index in response).
- **Why:** serverless pay-per-use pivot after local-CPU paddle was ruled out and the Fireworks GPU deployment kept disarming.
