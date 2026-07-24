# Models — stage × backend tracking

The pipeline's **stages** are stable; the **models** behind them swap. One doc per model-backed stage tracks its options, observed behavior, and ops quirks. Dated head-to-head comparisons live alongside in this folder.

| Stage | Doc | Live pick | Env prefix |
| --- | --- | --- | --- |
| Parse | `parse.md` | PaddleOCR-VL 1.6 @ Fireworks deployment | `PARSE_*` |
| Text | `text.md` | GLM-5.2 (Fireworks serverless) | `TEXT_*` |
| Judge | `judge.md` | Claude Sonnet 4.6 (user's own Anthropic key) | `JUDGE_*` |

Scrutiny and naming are deterministic logic, not models — no docs here.

## The modular contract

- **Per-run plans (Jul 24, 2026):** the worker now owns a per-stage option registry (`services/analyzer/models.py`, served at worker `GET /models`, proxied at portal `GET /api/models/options`). The gate card renders per-stage dropdowns; the chosen option ids travel with the gate decision → `POST /runs` `plan` → resolved at run start (unknown/unavailable = loud failure, never substitution) → frozen into the run's `config.json` + per-run `pipelineVersion`. Env config is now only the *default*. The spec §3 auto-proceed rule is suspended: every packet gates so staff pick the plan.
- **Backends are env-only** — `<STAGE>_BACKEND` + `<STAGE>_MODEL`, no code changes; `llm.py` supports fireworks + anthropic + generic OpenAI-compatible (`openai` backend + base URL/key, e.g. Novita) for every stage; `mistral` is a parse-only document-API backend (`mistral_ocr_parse.py`). Set vars → restart Analyzer Worker → verify the pipeline string in `/health`.
- Every run is honestly labeled via `pipelineVersion` — a run always says what produced it.
- **Adding a candidate** = a new row/subsection in the stage doc. **Promoting one** = env flip + a dated comparison note in this folder (same packet through old and new — see `parse-comparison-2026-07-24.md` for the pattern).

## Swap recipes (validated Jul 24, 2026)

- **All-Anthropic flip** (Fireworks-outage escape hatch), four vars: `PARSE_BACKEND=anthropic`, `TEXT_BACKEND=anthropic`, `PARSE_MODEL=claude-sonnet-4-6`, `TEXT_MODEL=claude-sonnet-4-6` → restart worker → check `/health`. Gotcha: a lingering Fireworks `TEXT_MODEL` id under `TEXT_BACKEND=anthropic` 404s mid-run.
- **Revert to spec config:** `PARSE_BACKEND=paddle`, `TEXT_BACKEND=fireworks`, `TEXT_MODEL=accounts/fireworks/models/glm-5p2` (`PARSE_MODEL` may stay; paddle ignores it).
- Worker fails fast + honest on misconfig (`backendProblems` in `/health`, run-failed revert) — but see `parse.md` for the one failure mode `/health` cannot see.

## Status board (last verified Jul 24, 2026 ~18:45Z — recheck before trusting)

- Spec config live in worker: `parse=paddle:vl-1.6@p4tlc3h1 judge=anthropic:claude-sonnet-4-6`.
- **Paddle deployment DISARMED** (second time that day; account in good standing) — next Paddle run 404s until a console re-arm. Signature + fix in `parse.md`.
- Comparisons on file: `parse-comparison-2026-07-24.md` — Paddle vs Claude, both test packets; verdict: spec config stands.
- **Local-CPU Paddle: RULED OUT (Jul 24, 2026 spike).** PaddleOCR-VL 0.9B on dev box (8 vCPU/16GiB): init ~52s, >6 min/page, 6.4GiB RSS — hours per packet and OOM-margin on prod (2 vCPU/8GB Reserved VM). Corroborated by external Mac benchmark (35–161s/page). Serverless API-only direction confirmed by user.
- **Mistral OCR 4 VALIDATED (Jul 24, 2026)** — 10p stress packet in 104s, split/flags on par with baselines, best table fidelity, ~$0.04/packet. See `parse-comparison-2026-07-24-mistral.md`. Registry status promoted to validated.
- **Novita candidates BLOCKED on account balance** — `paddle-vl-novita` + `deepseek-ocr2-novita`: key valid, catalog ids confirmed, but `403 NOT_ENOUGH_BALANCE`. Retest after top-up.
