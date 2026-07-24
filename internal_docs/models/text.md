# Text stage

**Role:** text-only LLM passes inside split/classify — boundary refinement, classification against the pinned template's document blocks, unassigned-span summaries.

## Options

| Backend | Status | Notes |
| --- | --- | --- |
| **GLM-5.2** (`accounts/fireworks/models/glm-5p2`, Fireworks serverless) | **LIVE** | Reasoning model — see behavior below. |
| Claude (`claude-sonnet-4-6`) | Validated fallback | Part of the all-Anthropic outage flip (`_index.md`). |
| Untested on the same key | Available | `kimi-k2p6`, `glm-5p1`, `deepseek-v4-pro`, `gpt-oss-120b` — serverless, unevaluated for these passes. |

## Observed behavior

- **GLM-5.2 is a reasoning model: it thinks 1000+ tokens BEFORE emitting JSON.** JSON tasks need `max_tokens ≥ 4096` plus last-parseable-object extraction, or the answer gets truncated away and refine passes silently no-op. Symptoms: "Extra data" parse errors, boundaries that never split.
- Rides the same Fireworks account as the parse deployment — a suspension takes both stages down at once (the all-Anthropic flip covers exactly this).

## Cost

Per-token serverless — negligible next to parse GPU-hours and judge tokens.
