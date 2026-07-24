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

## PaddleOCR-VL 1.6 pipeline (learned 2026-07-24)
- Init: `PaddleOCRVL(pipeline_version="v1.6", vl_rec_backend="vllm-server", vl_rec_server_url, vl_rec_api_model_name=<deployment id>, vl_rec_api_key, vl_rec_max_concurrency)`. Local models (doc-ori classify + PP-DocLayoutV3) auto-download to `~/.paddlex/official_models/`; VL model is server-side.
- **Batch, never loop:** calling `pipe.predict(page)` repeatedly is flaky — intermittent instant `RuntimeError: Exception from the 'cv' worker: std::exception` (state bug in their queue machinery; same image can pass then fail). ONE `pipe.predict([list of pages])` call is reliable and faster (internal parallelism). This was NOT thread- or env-related — reproduced on main thread of a fresh process.
- Run the pipeline in a dedicated subprocess per packet (analyzer does): crash isolation from the server, memory returned per packet, fresh main thread.
- `res.markdown` is a dict with `markdown_texts`; use `save_to_markdown`/`save_to_json` and read files back. Tables come back as HTML inside the markdown.
- Needs GCC runtime libs — see nix-gcc-runtime.md.

## Fireworks account suspension (seen 2026-07-24)
- Symptom: VL deployment + every Fireworks model return 404 "Model not found, inaccessible, and/or not deployed"; control-plane API returns HTTP 412 "Account creditclaw is suspended" (spending limit / unpaid invoice). Fix is user-side: fireworks.ai/account/billing.
- Suspension kills BOTH the paddle VL deployment AND GLM text passes (TEXT_BACKEND default). Working escape hatch: flip PARSE_BACKEND/TEXT_BACKEND=anthropic + *_MODEL=claude-sonnet-4-6 (llm.py supports both backends for every stage), run, revert.
- **Why:** a "paddle broke again" symptom can be pure billing — check the provider account (one curl to control plane) before debugging code.
- Gotcha: packet lastRunError double-truncates (my 800-char stderr tail is then head-truncated downstream), hiding the terminal exception line. Worker workflow logs carry the full traceback — read those, not lastRunError.
- Suspension aftermath (2026-07-24): re-adding credit un-suspends the account but does NOT restore the deployment's model — deployedModels list empty, activeModelVersion "", inference 404s INSTANTLY (a merely scaled-to-zero deployment instead blocks while spinning up). Fix = re-deploy the model onto the deployment (control plane/console). Deployment billing: dedicated H100 by GPU-hour, scaleToZeroWindow 3600s = a full paid idle hour after last call — time-based, not token-based; this dwarfs token costs.
- Anthropic flip recipe (validated 2026-07-24 PM): needs FOUR shared env vars — PARSE_BACKEND=anthropic, TEXT_BACKEND=anthropic, PARSE_MODEL=claude-sonnet-4-6, TEXT_MODEL=claude-sonnet-4-6 — then restart Analyzer Worker and check /health pipeline string. A lingering fireworks TEXT_MODEL id under TEXT_BACKEND=anthropic 404s mid-run ("model: accounts/fireworks/models/glm-5p2"). Revert = PARSE_BACKEND=paddle, TEXT_BACKEND=fireworks, TEXT_MODEL=accounts/fireworks/models/glm-5p2 (PARSE_MODEL may stay; paddle ignores it). Worker fails fast+honest on misconfig (backendProblems in /health, RUN FAILED revert).
- Post-suspension console redeploy restores serving in-place (same deployment id, settings preserved); control-plane API could NOT re-arm it (deployedModels POST -> "only addon models...", min=1 boot never armed activeModelVersion). Console is the tool for model re-arm.
