# Homium Analyzer — Build Spec v0.7 (DRAFT — awaiting spec-author blessing)

**Status:** draft, Jul 24, 2026. Rebased on v0.6.3 FINAL plus everything built and learned since. **v0.6.3 (`attached_assets/homium-analyzer-spec-v0.6.3-FINAL_*.md`) stays the governing spec until the product owner blesses this file** — at that point this one supersedes all prior copies. Style unchanged: decisions, not prose.

---

## 0. What changed since v0.6.3 (reality, not proposals)

1. **Engine v1 is built and validated end-to-end** — parse → split/classify → judge → scrutiny → naming → ingest, real runs on both synthetic test packets, honest failure path (`run-failed` → revert to gated) exercised. "One real packet end-to-end" from the v1 cut: **done**.
2. **Per-run model plans replaced fixed config.** The worker owns a per-stage option registry (`GET /models`, proxied at `GET /api/models/options`); the gate card renders per-stage dropdowns; the chosen plan travels with gate approval, resolves at run start (**unknown/unavailable = loud failure, never substitution**), and freezes into the run's `config.json` + `pipelineVersion`. Env config is only the default plan.
3. **Auto-proceed is suspended** (supersedes v0.6.3 §1.3's "<20 pages AND zero flags" auto rule): every packet gates so staff pick the model plan. Reinstatement condition = a blessed default plan + explicit product-owner say-so.
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

1. **Parse is serverless-API only** (local-CPU ruled out by spike). Registry options: Paddle-1.6 @ Fireworks deployment (spec pick; scale-to-zero; client = `paddleocr[doc-parser]`, `vl_rec_backend="vllm-server"`, subprocess-per-packet, one batched call), Mistral OCR 4 (validated), all-Claude (escape hatch), Novita pair (blocked). **Open decision for spec author: keep Paddle as default despite disarm friction, or promote Mistral OCR 4 to default and keep Paddle as the quality benchmark.**
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
**v1 loose ends (engine candidates, need spec-author sign-off):** span-gluing rule (exclude preflight-flagged blank/dup pages from spans before mapping — both parsers absorbed planted junk into a span; judge caught it); region crops on demand instead of pre-cropping every page.
**v2 (additive only):** LangExtract + schemas (+precedence) · amount-level fraud · md-offset→bbox region highlighting in the review room · per-application index + chat with citations (`_future/llm-questions.md`).

## 6. Standing answers (carried forward verbatim where still true)

- **Demo bias:** no fixed date — engine before polish; a real parse of the sample packet is the demo. (Achieved; polish now permitted.)
- **Data:** scrubbed/synthetic packets only until retention + access controls exist. A gate, not a preference.
- **Cost visibility:** Originator and above; hidden from Applicant. Full-pipeline cost (incl. judge) shown at the gate.
- **Closing date:** portal-owned top-level field (built, editable in the case panel); edits re-evaluate hard expiries when the expiry engine lands.
- **Keys:** judge + parse credentials arrive via app secrets, never chat. (Standing ops note: org AI integrations are disabled; the Fireworks key covers serverless text models only — the Paddle deployment and any Anthropic/Novita usage ride the user's own accounts.)

## 7. Open questions for the spec author (the delta that needs a ruling)

1. Default parse plan: re-arm-and-keep Paddle vs promote Mistral OCR 4 (§2.1).
2. Auto-proceed: reinstate once a default plan is blessed, or keep every packet gated?
3. Span-gluing + crops-on-demand (§5 loose ends): approve for v1.x?
4. Anything in this draft that should NOT supersede v0.6.3 — say so and it reverts.
