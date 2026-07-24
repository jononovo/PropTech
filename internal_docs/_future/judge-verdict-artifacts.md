# Judge Verdict Artifacts & Run Telemetry — build spec (draft for input)

Status: proposal, Jul 24 2026 — spec-author endorsed, Sheaf-side review below. **Nothing built.** Feeds the v0.7 draft's amendments. Goal in one line: every score a human sees becomes traceable to the exact model output that produced it, and every run records how long each stage took — without changing how the pipeline runs.

## 1. Judge verdict artifacts (audit-grade raw output)

- Per analyzed document, persist the judge's COMPLETE raw output as `judge/doc-<N>.json` in the run's store folder (beside `md/`, `elements/`, `config.json`).
- Contents (pre-mapping, superset of what the sidecar carries):
  - `docIndex`, `pages: [start, end]`, `taxonomyId`
  - `scores: { quality, formatting, fraud_signal, confidence }` (floats 0–1)
  - `coreFields: { document_date, expiry_date, primary_party_name, issuing_party }` + any extras the model emitted
  - `flags: [{ code, detail, page? }]`, `description`, `pageNotes` if emitted
  - `raw_response` (untruncated model text), `model`, `promptVersion`, `tokens: { input, output }`, `latencyMs`, `timestamp`
- Rules:
  - Write-once, BEFORE the run POST. A verdict that isn't persisted fails the run (fail-loudly; same doctrine as parse artifacts).
  - The sidecar run object keeps carrying the mapped subset; this file is the audit superset. Reference it additively: `artifacts.judge = "judge/doc-<N>.json"`.
  - Covered by the store gitignore; migrates to App Storage with everything else.

## 2. Per-stage run telemetry (the missing speed axis)

- In `config.json` (already written per run), add: `timings: { renderMs, parseMs, splitClassifyMs, judgeMs, totalMs }`.
- In the POSTed run object, add one additive field: `durationMs` (total).
- Why: engine comparisons currently measure cost+quality but NOT speed — numbers were hand-copied from console polling. This makes every future A/B free.

## 3. Artifact coverage honesty (per-engine)

- Not every parse engine produces every artifact (bare-VLM parses emit markdown only; Paddle + Mistral also emit elements/bboxes; crops remain reserved). Record what THIS run actually produced: `config.json → artifactsProduced: { md: true, elements: bool, crops: bool }`.
- UI copy and future features (region highlighting) read this instead of assuming; prevents overselling one engine's artifacts as universal.

## 4. promptVersion

- Judge prompt gets a version constant (start `judge-v1`), recorded in every `doc-<N>.json` and in `config.json`. Bump on any prompt change. No registry, no framework — one string.

## Non-goals (explicit)

- No change to how the judge runs, no retries, no new pipeline stages.
- No UI in this spec (a later "score provenance" view can read `doc-<N>.json`).
- No per-page scoring layer beyond what preflight already does — page-level signals stay in preflight; document-level stays in the judge.

## Sheaf-side review input (main agent, Jul 24 2026)

Endorsed — pure audit-trail completion; matches fail-loudly and additive-contract doctrine. Answers to the four reviewer questions:

1. **`raw_response` cap:** untruncated by default, with a pathological guard only (e.g. 2MB → truncate + `truncated: true` marker). Audit value beats storage cost, but a looping model must not fill the store silently.
2. **Timings granularity:** both, no conflict — per-document `latencyMs` already lives in each `doc-<N>.json`; `config.json` carries the stage aggregate (`judgeMs`). They answer different questions.
3. **Tokens when backend doesn't report usage:** nullable fields; record exactly what the API returns, never estimate. (Honesty doctrine.)
4. **`artifactsProduced` in the sidecar run object too:** **yes, strongly** — the portal must render capability-aware UI (region highlighting v2, register metadata columns) without reaching into the analyzer store. One additive object on the run.

Implementation notes for whoever builds it:

- **Zero-pad `doc-<N>`** (`doc-03.json`) — same lexicographic-listing lesson as the pageRenders zero-padding fix.
- **Failure semantics:** any document's artifact-write failure fails the WHOLE run before the POST (revert packet → `gated` + `lastRunError`), never a half-posted run — mirrors the existing ingest-failure revert.
- Scores themselves are NOT new — the sidecar schema already requires `scores` per document and the UI consumes them (checks thresholds 0.7/0.7/0.25, flagged at fraud ≥ 0.3). This spec adds *provenance*, not scoring.
