---
name: Model backends for the Sheaf analyzer
description: Fireworks key scope, Paddle 1.6 deployment path, judge requirements — updated for spec v0.6.3 (Jul 24, 2026)
---

# Model backend facts (spec v0.6.3, verified Jul 24, 2026)

- The Fireworks key's serverless catalog = 6 models: kimi-k2p6, glm-5p1, glm-5p2, deepseek-v4-pro, gpt-oss-120b (text) + flux-1-schnell-fp8 (image gen). No serverless vision model — every VLM probe (qwen*-vl, llama4, paddleocr*) 404s. Fireworks' pay-per-token tier does NOT carry PaddleOCR-VL.
- **Paddle 1.6 real path (spec v0.6.3 §1.1):** product owner one-click-deploys `paddleocr-vl-1-6` from the Fireworks library → OpenAI-compatible URL; auto-scales to zero (set window 5–10 min, smallest GPU). Worker drives it through `paddleocr[doc-parser]` ≥3.6.0 + `paddlepaddle` ≥3.2.1 CPU (`pipeline_version="v1.6"`, `vl_rec_backend="vllm-server"`, `vl_rec_server_url=<URL>`) — NEVER the bare chat-completions VLM. Produces elements JSON + region crops the store must keep. Self-hosted Docker = break-glass only.
- Judge = frontier multimodal API (spec §1.2); Fireworks serves none → Anthropic key required regardless of parser. Org's Replit AI integrations are admin-disabled.
- Interim (approved, conditions): parse+judge both on Claude (`PARSE_BACKEND/JUDGE_BACKEND=anthropic`, model claude-sonnet-4-6) for the FIRST e2e packet only; honestly labeled via PIPELINE_VERSION; Paddle pipeline is the immediate next engine task.

**How to apply:** models are env-only (PARSE_*/JUDGE_*/TEXT_*) — set vars, restart Analyzer Worker, no code change. When the Paddle deployment lands, only its URL is needed (auth = existing FIREWORKS_API_KEY).
