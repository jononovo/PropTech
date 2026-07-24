# Analyzer — the engine (Python worker)

FastAPI worker (`services/analyzer/`, uvicorn :8000). Governed by the analyzer build spec **v0.6.3 FINAL** (`attached_assets/homium-analyzer-spec-v0.6.3-FINAL_*.md`) — the source of truth for pipeline decisions; supersedes everything older.

Talks to the portal **only through the public API**: pulls the packet via `GET /packet/file`, POSTs exactly one run to `POST /applications/{id}/analysis`, reports failure via `POST /packet/run-failed`. Its own `store/` working dir is local by design (engine workspace; re-fetches bytes per run; gitignored).

## Pipeline (per run)

1. **Parse** — PaddleOCR-VL 1.6 via the Fireworks library deployment (scale-to-zero), driven through the `paddleocr[doc-parser]` client pipeline (`vl_rec_backend="vllm-server"`), **never** bare chat-completions. Layout model runs locally in the worker; runs in a dedicated subprocess per packet (crash isolation); pages parsed in ONE batched call. Produces markdown + elements JSON + region crops + page renders.
2. **Split/classify** — segments the packet into document spans and maps them to the pinned template's document blocks (classification target = the template; no separate checklist objects). Unmappable spans go to an honest **unassigned** bucket. Text passes on GLM.
3. **Judge** — frontier multimodal model (Anthropic Claude, user's own key) scores each document: quality/consistency flags with page evidence, extracted dates. v1 fraud scope = metadata/visual/core-field consistency only — **no amount checks, don't oversell**.
4. **Scrutiny** — deep-scan tier driven by template criticality (critical+scarce or critical-with-alternative ⇒ deep fraud scan).
5. **Naming** — generated filenames per document (`YYYY-MM-DD_doctype_...`; `undated` when no date found).
6. **Ingest** — one run object POSTed to the portal. Every run is honestly labeled via `pipelineVersion`.

## Model backends

Env-driven, no code changes: `PARSE_*` / `TEXT_*` / `JUDGE_*` (backend + model per stage; `llm.py` supports fireworks + anthropic for every stage). Set vars → restart Analyzer Worker → verify the pipeline string in `/health`. `/health` reports `backendProblems` honestly; misconfigured runs fail fast and revert the packet.

Current spec configuration: **Paddle parse + GLM text + Claude judge** — validated head-to-head against all-Claude. Per-stage options, observed behavior, swap recipes, and ops/billing quirks are tracked in `models/` — start at `models/_index.md`.

## Where

- `app.py` (FastAPI), `runner.py` (pipeline orchestration), `paddle_parse.py`/`paddle_cli.py` (parse subprocess), `split_classify.py`, `judge.py`, `scrutiny.py`, `naming.py`, `llm.py` (backend abstraction), `portal.py` (API client), `store/` (run artifacts: md, elements, crops, renders, config+versions).
