---
name: Model backends for the Sheaf analyzer
description: What the Fireworks key can/can't reach, paddle deployment facts, judge requirements — checked July 24, 2026
---

# Model backend facts (verified July 24, 2026)

- The project's Fireworks key reaches exactly 6 serverless models: kimi-k2p6, glm-5p1, glm-5p2, deepseek-v4-pro, gpt-oss-120b (text-only) + flux-1-schnell-fp8 (image gen). Every vision model probed (qwen*-vl*, llama4-maverick, paddleocr*) returns 404 NOT_FOUND.
- PaddleOCR-VL-1.6 exists on Fireworks (`accounts/fireworks/models/paddleocr-vl-1-6`, image input supported) but is **Serverless: Not supported** — it only runs as a user-created on-demand deployment (Fireworks dashboard, billed per GPU-time). An API key alone cannot call it.
- Replit AI integrations are disabled by the org admin (user can enable in org settings; then Anthropic works keyless, billed via Replit credits).
- Spec v0.6.2: judge must be a frontier multimodal API — Fireworks doesn't serve one; needs Anthropic/OpenAI/Gemini regardless of parser choice.
- Analyzer is built model-agnostic: PARSE_BACKEND/PARSE_MODEL, JUDGE_BACKEND/JUDGE_MODEL env vars; parser swap to a paddle deployment is config-only by design.

**Why:** user's plan ("run paddle on Fireworks") is valid but requires the deployment step in THEIR Fireworks account; don't re-probe from scratch next session.
**How to apply:** when models get unblocked, set the env vars and restart the Analyzer Worker workflow — no code change.
