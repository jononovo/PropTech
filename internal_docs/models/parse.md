# Parse stage

**Role:** packet pages → markdown + elements JSON (per-page layout bboxes) + region crops + page renders. Feeds split/classify. Runs in a dedicated **subprocess per packet** (crash isolation, memory returned); all pages parsed in **one batched** predict call — looping page-by-page is flaky (intermittent cv-worker `RuntimeError`, a state bug in Paddle's queue machinery; not thread- or env-related).

## Options

| Backend | Status | Notes |
| --- | --- | --- |
| **PaddleOCR-VL 1.6** via Fireworks library deployment `accounts/creditclaw/deployments/p4tlc3h1` | **LIVE** (spec §1.1) | Driven through the `paddleocr[doc-parser]` ≥3.6.0 client pipeline (+ `paddlepaddle` ≥3.2.1 CPU): `pipeline_version="v1.6"`, `vl_rec_backend="vllm-server"`, server URL = Fireworks OpenAI-compat base, model = the deployment id. Layout model (PP-DocLayoutV3) runs locally in the worker. **Never the bare chat-completions VLM** — Baidu requires the full pipeline. |
| Claude (`claude-sonnet-4-6`) | Validated fallback | The interim path; honestly labeled via `pipelineVersion`. Parses dense forms cleaner than Paddle. Cost = tokens. |
| Self-hosted vLLM Docker | Break-glass only | |
| Fireworks serverless VLMs | Ruled out | The key's serverless catalog carries no vision model — every VLM probe 404s. |

## Observed behavior (Jul 24, 2026 head-to-head — full detail in `parse-comparison-2026-07-24.md`)

- **Segmentation parity with Claude** on both test packets: same doc count, same spans, same honest unassigns.
- **Systematic weak spot: label↔value association on dense layouts** (2-col URLA) → surfaces as judge flags (`truncated_parsed_markdown`, `missing_dollar_signs_in_parse`, `parser_field_misalignment`). The judge converting parse wobbles into visible flags is the safety net that makes Paddle acceptable.
- Skew: reads fine to 8°. Low-contrast photocopy: structure kept; left the recording date `undated` where Claude extracted it.
- Honest arithmetic in bank tables: no false continuity gaps; the planted gap was caught.
- Wall-clock: ~180–200 s warm per ~10-page packet (Claude interim: 84 s on the same packet).

## Ops & cost

- **Cost = H100 GPU-hours while the deployment is up**, on-demand; scale-to-zero after 600 s idle. Tokens negligible. Idle GPU-hours dwarf token costs — the Jul 24 credit burn was the earlier 60-min idle window.
- **Billing fragility (recurring):** an account suspension (spending limit / unpaid invoice) 404s the deployment AND the GLM text passes; control plane returns 412. Fix is user-side (fireworks.ai billing). Un-suspending does **not** restore the deployment's model.
- **Disarm signature** (read-only control-plane GET on the deployment): `state: READY` but `targetModelVersion` + `activeModelVersion` empty and deployedModels count 0 → inference 404s **instantly**. A healthy scaled-to-zero deployment keeps its deployedModel entry and blocks while spinning up. Worker `/health` does **not** catch this (config-level checks only) — the failure surfaces at run time as run-failed → packet back to `gated`.
- **Re-arm = Fireworks console redeploy** (~2 min, restores in place, settings preserved). The control-plane API cannot do it. Disarms have recurred hours after successful runs with the account in good standing — check the control plane before a run session.
- Environment: needs GCC runtime libs discovered from the Nix store (manylinux wheels); local layout models auto-download to `~/.paddlex/official_models/`.

## Open

- Span-gluing rule (exclude preflight-flagged blank/dup pages from spans) and region-crops-on-demand — parked in `../_future.md`, spec-author sign-off needed.
