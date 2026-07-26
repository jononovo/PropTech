# Homium Analyzer — Build Spec v0.7 (FINAL — blessed Jul 25, 2026; supersedes ALL prior copies)

**Status:** FINAL — blessed by the product owner Jul 25, 2026. **This is the ONE governing spec**; v0.6.3 and every older copy are superseded and deleted from the repo (one spec authority at a time). Rebased on v0.6.3 plus everything built and validated since. Style unchanged: decisions, not prose.

---

## 0. What changed since v0.6.3 (reality, not proposals)

1. **Engine v1 is built and validated end-to-end** — parse → split/classify → judge → scrutiny → naming → ingest, real runs on both synthetic test packets, honest failure path (`run-failed` → revert to gated) exercised. "One real packet end-to-end" from the v1 cut: **done**.
2. **Per-run model plans replaced fixed config.** The worker owns a per-stage option registry (`GET /models`, proxied at `GET /api/models/options`); the gate card renders per-stage dropdowns; the chosen plan travels with gate approval, resolves at run start (**unknown/unavailable = loud failure, never substitution**), and freezes into the run's `config.json` + `pipelineVersion`. Env config is only the default plan.
3. **Auto-proceed: WITHDRAWN (owner ruling Jul 26 2026, supersedes the Jul 24 reinstate-after-burn-in plan).** The pre-processing gate is liked and stays for EVERY packet — no auto-skip. Burn-in counting is moot. The gate keeps plan-selection for every gated packet.
4. **Parser reality check.** Paddle-1.6 @ Fireworks deployment is live and validated head-to-head (spec config stands), but the deployment **disarms itself repeatedly** (console re-arm required; account in good standing — see `models/parse.md`). Local-CPU Paddle is **ruled out** (spike: >6 min/page, OOM-margin on prod). **Mistral OCR 4 validated** as a strong alternative (10p in 104s, best table fidelity, ~$0.04/packet). Novita candidates blocked on account balance. The registry carries all of them; promotion = dated comparison + env flip.
5. **The portal grew the human half of the loop:** page review room (filmstrip) over real page renders served from the analyzer store (`GET /applications/{id}/runs/{runId}/pages/{page}?size=full|strip`), and **manual placements** (`POST /applications/{id}/placements`) that file or archive unassigned ranges — placements flip blocks to `filed`, land in the audit trail, and shrink the open-unassigned list. AI never places; reassignment wins.
6. **Chat/RAG gets a shape:** per-application searchable index over run artifacts + chat with citations — explicitly **after** analysis features are complete (`_future/llm-questions.md`). Still v2+.

## 1. Division of authority (unchanged, one addition)

| Concern | Owner |
|---|---|
| Template contract, pinned per application | **Portal** |
| Scrutiny depth, substitution scrutiny, overlap escalation, queue ordering (schema-spec §4) | **Portal rules — analyzer implements verbatim** |
| Expiry engine (two-clock model); analyzer only supplies dates | **Portal** |
| Verdicts **and placements** | **Humans only** — analyzer emits suggestions + confidence |
| Split, classify, name, quality/fraud scoring, artifacts, core fields | **Analyzer** |

## 2. Locked decisions (carried forward, amended where reality moved)

1. **Parse is serverless-API only** (local-CPU ruled out by spike). Registry options: Mistral OCR 4 (**default — owner-approved Jul 24**; validated head-to-head, best table fidelity, native elements/bboxes, $4/1k pages), Paddle-1.6 @ Fireworks deployment (**quality benchmark**, not default — two self-disarms in one day disqualify it as the default path; re-arm for dated head-to-heads; client remains `paddleocr[doc-parser]`, `vl_rec_backend="vllm-server"`, subprocess-per-packet, one batched call), all-Claude (escape hatch), Novita pair (kept as options, honest `experimental` status; blocked on account credits — work with zero code change once topped up). Revisit the default if Paddle-1.6-per-token ever ships or a dated comparison shows Mistral losing on Real5-class degradations.
2. **Single parse; multimodal judge as the independent check** (currently Claude Sonnet 4.6, user's own Anthropic key — key via app secrets, never chat).
3. **Pre-flight is a human gate** (built): deterministic checks → report → staff decision **+ model plan selection** (see §0.2–0.3). Gate, don't retouch — no image enhancement ever.
4. **Universal core fields from the judge** on every document: `document_date`, `expiry_date?`, `primary_party_name`, `issuing_party?`. Human eyes on every clock: dates shown at verdict time, editable, edits recorded. (Built.)
5. **Extraction is v2** — sidecar carries `extractions: []` from day one (unchanged; precedence rule stands: grounded extraction beats judge core field, mismatch ⇒ `needs_review`).
6. **Human override is absolute.** Suggestions + confidence only; every override recorded. Now includes placements and verdict-time date edits, both in the audit trail.

## 3. Pipeline (v1 — as built)

Intake → pre-flight → gate (+plan pick) → parse (per plan; save per document: raw md, elements JSON, region crops, page renders, config+versions) → split/classify (deterministic signals first — page-number resets, "Page X of Y", letterheads, form IDs URLA/1003, 1008, W-2, 4506-C, CD, LE; LLM only for ambiguous boundaries; `docType` exact-match first, name fallback; no match → **unassigned**, honestly) → scrutiny per portal §4 → judge (scores, flags with page evidence, descriptions, core fields) → naming (`<date>_<blockId>_<issuer>_<party>.pdf`, derived never hand-written, human rename wins) → sidecar POST.

**v1 fraud scope unchanged:** metadata/structural + judge visual anomalies + core-field consistency. No amount-level checks until v2 extractions. Do not oversell.

## 4. Write-path & serving (built)

- `POST /api/applications/{id}/analysis` — one run object; portal appends, derives `latestRunId`, validates every `suggestedBlockId` against the pinned template; duplicate `runId` → 409. **Analyzer never touches the database; this endpoint is its only door.**
- `POST /packet/run-failed` — honest revert to `gated` + `lastRunError`.
- **New since 0.6.3:** analyzer store serves page images (`/store/{appId}/{runId}/pages/{page}?size=full|strip`, strip = cached 320px downscale); portal proxies them to the review room. Older runs stay on disk for audit; **latest run wins on every screen** (no run-history UI, by decision).

## 5. v1 / v2 cut (updated)

**v1 (done):** sidecar+fixtures ✓ · pre-flight+gate ✓ · docType ✓ · closing-date field ✓ · parse via registry (Paddle/Mistral/Claude validated) ✓ · split/classify ✓ · judge ✓ · scrutiny ✓ · naming ✓ · real packets end-to-end ✓ · per-run plans ✓ · review room + placements ✓.
**v1.x approved, to build (owner + spec author + builder aligned, Jul 24–25):**
- ~~Region crops on demand~~ — struck as a decision: crops stay empty until a consumer exists; nothing to build or spec.

**v1.x built (Jul 24–25, each validated on a real run — see `_future/judge-verdict-artifacts.md` and `_future.md`):**
- **Span-gluing rule** (built + validated Jul 25, run-20260725-002934-b0b7): pages preflight-flagged blank or exact-duplicate are excluded from document spans before mapping — DETERMINISTIC preflight flags only, never model judgments; the duplicate's original stays; excluded pages are hard span breaks and surface as visible junk in unassigned ("Pre-flight junk (…)"), never silently dropped; whisper records the exclusions. Validation: deed span shed planted p.6 (blank) + p.7 (dup) to p.5 alone. Origin evidence: every engine tested glued those pages into the Grant Deed span.
- **Fraud-scoring toggle** (built + validated Jul 25, same run): `RunPlan.fraudScoring`, default ON, frozen into `config.json` (`judgePromptVersion`: `judge-v1` / `judge-v1-nofraud`). OFF drops fraud from the judge prompt, receipts, scores, and sidecar — `fraud_signal` absent means "not scored this run", never a fake 0, and every portal surface renders the absence honestly (Register, Review chips, checks count). Contract additive: `AnalysisScores.fraud_signal` now optional; the run echoes `fraudScoring`. Scope ruling: fraud only — quality/formatting are never optional.
- **Judge verdict receipts:** `judge/doc-<N>.json` per document — raw model output (2MB cap with truncation marker), tokens as the backend's `usage` reports (nullable), per-doc `latencyMs`, `promptVersion` (`judge-v1`, bump on any prompt change). Write-once before the run POST; referenced additively via `artifacts.judge`.
- **Run telemetry:** per-stage `timings` (`renderMs/parseMs/splitClassifyMs/judgeMs/totalMs`) in `config.json`; additive `durationMs` + `artifactsProduced` on the run object and sidecar — artifact coverage recorded per run, never assumed per engine. First datapoint: split/classify (GLM) dominates wall-clock, not parsing — an optimization candidate, not a decision.
**v2 (additive only):** LangExtract + schemas (+precedence) · amount-level fraud · md-offset→bbox region highlighting in the review room · per-application index + chat with citations (`_future/llm-questions.md`).

## 6. Standing answers (carried forward verbatim where still true)

- **Demo bias:** no fixed date — engine before polish; a real parse of the sample packet is the demo. (Achieved; polish now permitted.)
- **Data:** scrubbed/synthetic packets only until retention + access controls exist. A gate, not a preference.
- **Cost visibility:** Originator and above; hidden from Applicant. Full-pipeline cost (incl. judge) shown at the gate.
- **Closing date:** portal-owned top-level field (built, editable in the case panel); edits re-evaluate hard expiries when the expiry engine lands.
- **Keys:** judge + parse credentials arrive via app secrets, never chat. (Standing ops note: org AI integrations are disabled; the Fireworks key covers serverless text models only — the Paddle deployment and any Anthropic/Novita usage ride the user's own accounts.)

## 7. Rulings record (all deltas resolved Jul 24–25; owner + spec author + builder)

1. Default parse plan: **Mistral OCR 4** (§2.1). Paddle stays as quality benchmark. **Live Jul 25:** env default flipped; the registry maps `mistral-ocr-4` as the parse default. Burn-in count runs on this plan (flagged test packets don't count).
2. Auto-proceed: **reinstate after ~10-clean-run burn-in on the default plan** (§0.3).
3. Span-gluing: **approved → built + validated Jul 25** (deterministic flags only; §5). Crops-on-demand: **struck** (§5).
4. Judge receipts + run telemetry: **built as specced** (§5); as-built choices (2MB raw cap, nullable tokens, per-doc latency, sidecar `artifactsProduced`) ratified. parseMs calibration checked at code level Jul 25: the timer wraps the entire Mistral OCR call (single batched request) — sub-second small-packet parses are real, not a timer gap.
5. Fraud-scoring per-run toggle: **approved (scope: fraud only, default ON) → built + validated Jul 25** (§5). Absent score = "not scored this run" — never fabricated.

**Blessed Jul 25, 2026** — promoted to `attached_assets/` as v0.7 FINAL; both v0.6.3 copies deleted.

## 8. Ops standing notes (new since 0.6.3)

- **Off-Replit dev:** document bytes fall back to local disk (`DATA_DIR/object-store`) ONLY when both `PRIVATE_OBJECT_DIR` and `REPL_ID` are absent; on Replit with missing config every storage call fails loudly. The stale-bytes edge (PDF-write-succeeds/thumb-fails restoring a record over replaced bytes) was **fixed Jul 25** by write ordering: thumbnails (cosmetic, rewritten every upload) first, the sha-referenced PDF LAST — any failure before the PDF write restores a record whose sha still matches its bytes. Residual (rare, accepted): a failure after the PDF write can still mismatch; the full fix is sha-versioned object keys, deferred until it earns its prod-data migration.
- The Replit **workspace dev server** often runs ahead of both prod and GitHub; check it when "latest" matters.
