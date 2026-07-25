---
name: Per-run model plans
description: How per-run model selection works (worker registry, plan resolution honesty rule) and why every packet gates.
---

# Per-run model plans (built Jul 24, 2026)

- Single source of truth for per-stage engine options = the WORKER registry (`services/analyzer/models.py`). Portal `GET /api/models/options` is a verbatim proxy; dropdowns can never drift from what the worker runs.
- **Honesty rule:** plan option ids resolve at run start; unknown/unavailable → run fails loudly. Never silently substitute an engine. Resolved plan + per-run pipelineVersion are frozen into the run's `config.json`.
- Env config (`PARSE_BACKEND` etc.) is only the system default now; plan > env.
- Spec §3 auto-proceed (<20 clean pages) is SUSPENDED deliberately — every packet gates so staff pick the plan. Restore = flip `auto` back in packet router.
- **Rulings (Jul 24, 2026, spec author + user, not yet implemented):** default parse = Mistral OCR 4 (Paddle stays registry benchmark); auto-proceed returns after ~10 consecutive clean runs on the blessed default plan. Implement when v0.7 is blessed.
- Paddle subprocess gets its VL endpoint/model/key/pipeline_version via env vars (`PADDLE_VL_URL/MODEL/KEY`, `PADDLE_PIPELINE_VERSION`) passed by the parent — the CLI has no other channel.
- `llm.py chat()` backends: anthropic | fireworks | openai (generic OpenAI-compatible, needs base_url+api_key — Novita). Mistral OCR is NOT chat-shaped: separate document-API adapter (`mistral_ocr_parse.py`, one call per packet, 0-based page index in response).
- **Why:** serverless pay-per-use pivot after local-CPU paddle was ruled out and the Fireworks GPU deployment kept disarming.

## Jul 25 — v0.7 draft + two builds on main
- PR #5 (docs-only) bakes ALL rulings into v0.7 draft; flow: merge → owner says "blessed" → local agent promotes to attached_assets as v0.7 FINAL + deletes v0.6.3 → replit.md spec pointer must be updated then.
- Span-gluing GREEN-LIT + BUILT (Jul 25): deterministic preflight blank/exact-dup only; junk = hard span break + visible unassigned entry; regexes in split_classify.py must track preflight.ts flag strings.
- Fraud toggle contract: RunPlan.fraudScoring (default true); OFF → fraud_signal ABSENT everywhere + promptVersion judge-v1-nofraud; absent = "not scored", never fake 0.
- Both await one 9-pager --no-fraud validation run (~20¢, needs owner approval per standing order).
- Jul 25 VALIDATED (run-20260725-002934-b0b7, 64s, ~20¢): span-gluing + fraud-off in one 9-pager run; default plan flipped to mistral in SHARED env (PARSE_BACKEND=mistral, PARSE_MODEL=mistral-ocr-latest — must equal MISTRAL_OCR_MODEL or registry default won't map). Analyzer plan HTTP schema = dict[str, str|bool]; widen it for any new plan toggle or gate 422s. GLM refine variance: this run merged URLA+bank-stmt (p.1-3) — judge flagged mixed_document_types honestly; split variance is what burn-in watches.
