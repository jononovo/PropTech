---
name: Model backends for the Sheaf analyzer
description: Fireworks key scope, Paddle 1.6 deployment path, judge requirements — updated for spec v0.6.3 (Jul 24, 2026)
---

# Model backend facts (spec v0.6.3, verified Jul 24, 2026)

- The Fireworks key's serverless catalog = 6 models: kimi-k2p6, glm-5p1, glm-5p2, deepseek-v4-pro, gpt-oss-120b (text) + flux-1-schnell-fp8 (image gen). No serverless vision model — every VLM probe (qwen*-vl, llama4, paddleocr*) 404s. Fireworks' pay-per-token tier does NOT carry PaddleOCR-VL.
- **Paddle 1.6 real path (spec v0.6.3 §1.1):** deployment EXISTS (Jul 24, 2026): `accounts/creditclaw/deployments/p4tlc3h1`, auth = existing FIREWORKS_API_KEY, scales to zero. Worker drives it through `paddleocr[doc-parser]` ≥3.6.0 + `paddlepaddle` ≥3.2.1 CPU (`pipeline_version="v1.6"`, `vl_rec_backend="vllm-server"`, `vl_rec_server_url=<OpenAI-compat base https://api.fireworks.ai/inference/v1, model=the deployment id>`) — NEVER the bare chat-completions VLM. Produces elements JSON + region crops the store must keep. Acceptance: same sample packet through Claude-interim vs Paddle for before/after; verify scale-to-zero during first tests. Self-hosted Docker = break-glass only.
- Judge = frontier multimodal API (spec §1.2); Fireworks serves none → Anthropic key required regardless of parser. Org's Replit AI integrations are admin-disabled.
- Interim (approved, conditions): parse+judge both on Claude (`PARSE_BACKEND/JUDGE_BACKEND=anthropic`, model claude-sonnet-4-6) for the FIRST e2e packet only; honestly labeled via PIPELINE_VERSION; Paddle pipeline is the immediate next engine task. User OK'd latest Sonnet or Haiku; explicitly their own API key, never Replit AI integrations.
- ANTHROPIC_API_KEY is an ACCOUNT-linked secret: present in process env (shell + workflows) but INVISIBLE in the workspace secrets listing. Verify via `[ -z "$ANTHROPIC_API_KEY" ]` in shell, not the secrets list.
- GLM-5.2 is a reasoning model: it thinks 1000+ tokens BEFORE emitting JSON. JSON tasks need max_tokens ≥4096 and last-parseable-object extraction, or the answer gets truncated away and refine passes silently no-op (symptom: "Extra data" parse errors / boundaries never split).

**How to apply:** models are env-only (PARSE_*/JUDGE_*/TEXT_*) — set vars, restart Analyzer Worker, no code change. When the Paddle deployment lands, only its URL is needed (auth = existing FIREWORKS_API_KEY).
