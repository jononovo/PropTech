# Homium Analyzer — Build Spec v0.6.2
**Aligned to portal contract · v1/v2 cut line locked · all load-bearing claims verified at primary source (Jul 23, 2026)**

---

## Note to the agent building the portal

**What this is:** the spec for the **Analyzer** — the AI pipeline described in Part C1 of your `homium-product-spec.md` ("separate build; user researching the AI side independently"). That research happened in a parallel thread; this document is its output.

**How it relates to your build:**
- It changes **nothing** in your built-and-running v1. No template contract mutations, no schema changes, no code impact today.
- It **defers to your documents** everywhere they overlap: the pinned template JSON is the analyzer's input contract; your three dimensions drive scrutiny exactly per your schema-spec §4; your two-clock expiry model stands (the analyzer just supplies the dates it needs).
- It **proposes three additive extensions** for you to accept, adjust, or reject: an `analysis/<applicationId>.json` sidecar as the analyzer's write-path (your open item C8), an optional `docType` field on document blocks, and a pre-flight gate as the first staged state in your C2 intake flow.

**What to do with it:** read §0 (division of authority), the v1/v2 cut line (§7), and the write-path (§5 — now API-delivered per your review). You can build triage against sidecar fixtures immediately; the analyzer doesn't need to exist yet.

**Changelog v0.6.1 → v0.6.2:** `docType` moved INTO v1 (user decision): trivial cost (optional field + builder dropdown), core-accuracy benefit, and avoids backfilling every template created before it existed. Name-matching remains the fallback for blocks without it.

**Changelog v0.6 → v0.6.1 (verification pass + second review):** POST payload is now a single run object (portal appends, portal owns `latestRunId` — fixes read-modify-write race); portal validates `suggestedBlockId` against the pinned template on ingest; parser endpoint guidance corrected to verified reality (official vLLM Docker is the only confirmed 1.6 serving path today); Real5-OmniDocBench evidence added;  LangExtract v2 notes updated (current v1.6.0; not an officially supported Google product — no SLA).

**Changelog v0.5 → v0.6 (from your review + product decision):** write-path is now `POST /api/applications/{id}/analysis` (portal store owns the file); pre-flight cost estimate = full pipeline including judge; core-field precedence rule added; `latestRunId` added; statement-period bound moved to schema data; detection hints seeded with standard form IDs; **LangExtract and the vector index deferred to v2**; v1 fraud scope stated explicitly; triage verdict now explicitly confirms core fields.

---


**Relationship to your docs:** this is the "separate build" analyzer. It **defers to** `homium-template-schema-spec.md` and the pinned-template contract everywhere they overlap. Extensions proposed here are additive only (per your C8 rule). Supersedes all prior IDCM spec versions.

---

## 0. Division of authority (read first)

| Concern | Owner |
|---|---|
| What documents a loan requires, requirement/criticality/sourcing, alternatives, expiry schema | **Portal template JSON** (pinned copy in the application file) |
| Scrutiny depth per document, substitution scrutiny, overlap escalation, queue ordering | **Portal rules** (schema-spec §4) — analyzer implements them verbatim |
| Expiry engine (two-clock model, escalation ladder, clock-stops on accept) | **Portal** (C5) — analyzer only supplies the dates |
| Verdicts | **Humans only**, in triage/review (A6). Analyzer emits suggestions with confidence |
| Splitting, classification, naming, quality/fraud scoring, page/document artifacts, core-field capture | **Analyzer** (this spec) |

## 1. Locked analyzer decisions

1. **Parser: PaddleOCR-VL 1.6**, two-stage: PP-DocLayoutV3 layout on the analyzer worker; region crops → VL model endpoint. Behind one interface `parse_document()`; engine swap = config.
   **Why 1.6 specifically (verified at source):** besides leading OmniDocBench v1.6 (96.33, self-evaluated), Baidu's Real5-OmniDocBench shows 1.6 setting SOTA across all five real-world degradation scenarios — scanning, warping, screen-photography, illumination, skew — which is precisely this product's document population (crooked scans, folded pages, phone photos).
   **Endpoint (verified reality, Jul 2026):** the only confirmed 1.6 serving path today is the official vLLM Docker image (`paddleocr-genai-vllm-server`, model `PaddleOCR-VL-1.6-0.9B`) self-hosted on a serverless GPU (RunPod/Modal class). Third-party hosts currently confirmed only for 0.9B-v1 / 1.5; architecture is plug-compatible, so a hosted 1.5 endpoint is an acceptable interim with a small accuracy delta. Re-check third-party 1.6 availability at build time. Client side: `paddlepaddle` ≥3.2.1 (CPU build) + `paddleocr[doc-parser]` ≥3.6.0, `pipeline_version="v1.6"`, `vl_rec_backend="vllm-server"`.
2. **Single parse**; a multimodal **judge** (frontier API now, self-hosted later) reviews page image + parsed md as the independent check.
3. **Pre-flight gate** (proposed addition to your C2 intake flow — see §3).
4. **Universal core fields on every document** — the judge emits `document_date`, `expiry_date?`, `primary_party_name`, `issuing_party?` inside its per-page/per-doc output. These are what make C5's clocks computable and filenames derivable. No extra model calls.
   **v1 rule — human eyes on every clock:** core fields are ungrounded judge output in v1 (no extraction to cross-check them). Therefore the triage/review verdict UI must display `document_date` / `expiry_date` alongside the accept/reject buttons — accepting a document explicitly confirms the date its clock will run on. Dates editable at verdict; edits recorded.
5. **Extraction tiers ≠ scrutiny tiers — and extraction is v2.** Scrutiny depth = f(block `criticality`) per your §4, in v1. *Extraction* (LangExtract full-field schemas, character-grounded, ~10–20% of volume: bank_statement, pay_stub, w2_or_tax_return, government_id, application_form, property_deed) ships in v2. The sidecar carries `extractions: []` from day one — always present, empty in v1, populated in v2 with zero contract change. Orthogonal: a `critical` appraisal gets full scrutiny but may never have an extraction schema.
   **Precedence rule (applies from v2):** where a grounded extraction field and a judge core field cover the same fact (e.g. `statement_period_end` vs `document_date`), the grounded value wins; any mismatch ⇒ `needs_review` flag. Closes the staleness/fraud hole cheaply.
6. **AI never writes verdicts.** Output = suggestions + scores + flags, rendered for your paired-verdict triage/review surfaces.

## 2. Pipeline

1. **Input:** application id + the 300+ page PDF (or per-block uploads already in `uploads/<appId>/<blockId>/`).
2. **Pre-flight** (deterministic, ms/page): file validity, page count, metadata snapshot; per-page blur/skew/DPI/contrast/blank/duplicate scores. → report + gate (§3).
3. **Parse** (Paddle): md + elements JSON + region crops + page renders per segment, saved to the analyzer artifact store.
4. **Split & classify:** deterministic boundary signals (page-number resets, "Page X of Y", letterheads, form IDs) then LLM for ambiguous boundaries; classify each segment **against the pinned template's document blocks** (see §4 for the mapping). No match → your **unassigned bucket** for manual triage.
5. **Scrutiny per your §4:** depth from block criticality; substitution scrutiny when an alternative satisfies a group whose primary is `critical`; overlap escalation (`critical`+`scarce`, critical-by-alternative, multiple critical failures in one section) → **deep scan** across the workfile (cross-document consistency + file-metadata anomaly pass).
   **v1 fraud scope, stated plainly:** `fraud_signal` = file metadata/structural anomalies + judge visual anomalies + core-field consistency (names/dates/parties across documents). **No amount-level checks** (deposits vs stated income) until v2 extractions exist. Do not oversell v1 fraud detection.
6. **Judge:** page image + md + pre-flight flags → quality/formatting/fraud-signal scores, legibility zoning, description, universal core fields.
7. **[v2] Extraction-tier docs only:** LangExtract with per-type schema → fields with character offsets (grounding), confidence, normalized values (dates ISO, money cents). Failed validation → `needs_review`, never silently accepted. Offsets ground into the parsed md; highlight-on-page-image requires the md-offset → elements-bbox mapping (v2 decision; elements JSON is retained in the artifact store for exactly this).
8. **Naming:** derived, never hand-written: `<document_date>_<blockId-or-type>_<issuing_party?>_<primary_party_lastname>.pdf`, collision-suffixed. Human rename always wins and is recorded.
9. **Output:** analysis result written to the integration sidecar (§5) for the portal's triage report, register, review queue, and (future) expiry engine.

## 3. Pre-flight gate (proposed additive stage in your C2 flow)

Runs as the *first staged processing state* after drop, before pipeline cost is incurred:
- **Report:** filename · pages · **est. cost/time for the FULL pipeline — parse + judge + deep scans; at 300+ pages the judge is the dominant cost line, and the gate exists for informed consent before spend** · verdict line · 3 thumbnails (2 worst-scoring pages + 1 best, by the deterministic per-page scores — no model calls) · plain-language flags ("p.41–43 below 150 DPI").
- **Gate:** `< 20 pages AND zero red flags` → auto-proceed. Otherwise wait for: **Process** / **Process anyway** / **Request better version** (pre-drafts the stakeholder message; fits your whisper-audit posture — the report is stored as part of the audit trail).
- Cost figures visible to Originator and above; hidden from Applicant.
- Rendering follows your Ops Desk system (mono for numbers/filenames, exception-based display, no decoration). No image "enhancement" is ever applied before parsing — gate, don't retouch.

## 4. Classifying against blocks — one additive contract proposal

Your document blocks carry `name` but no machine type. The analyzer keeps a global **taxonomy** (document-type vocabulary with detection hints + extraction-tier membership + type-level schemas). Proposal, additive and optional per C8:

- `Block(kind:"document")` gains optional `docType?: string` (taxonomy id, e.g. `"bank_statement"`).
- With `docType`: classification is exact — segment type → matching block(s), disambiguated by section/owner.
- Without it: fallback name-similarity matching between block `name` and taxonomy `display_name`/hints (works today, weaker).
- The builder UI can expose `docType` later as a quiet dropdown; nothing breaks if it's absent.

Classifier contract: output is a taxonomy id or `unassigned` — never an invented category. Human reassignments are logged and periodically reviewed to improve detection hints.

**Seed detection hints with standard mortgage form IDs** — URLA/Form 1003, Form 1008, W-2, 4506-C, Closing Disclosure, Loan Estimate. Printed form IDs are the highest-yield deterministic split/classify signal in this domain; they cost nothing and never hallucinate.

## 5. Write-path into the portal (your C8 open item — revised per your review)

**API-delivered, single-run POST.** The analyzer never sees or sends accumulated state:

- Analyzer calls **`POST /api/applications/{id}/analysis`** with **one run object** as the body (the object inside `runs[]` below — `runId`, `startedAt`, `preflight`, `documents`, `unassigned`, `whisper`).
- The **portal's store module appends** the run to the sidecar file and **sets `latestRunId` itself**. Analyzer stays stateless toward the portal; no read-modify-write race; single-writer semantics preserved.
- On ingest, the portal **validates every `suggestedBlockId` resolves to a document block in the application's pinned template** (same invariant style as template save) — put this in the OpenAPI endpoint description so it survives codegen.
- OpenAPI spec first, codegen, then implement — per your working agreement D.

Sidecar file shape on disk (portal-owned; unchanged):
```json
{ "applicationId": "...", "latestRunId": "...", "runs": [{
    "runId": "...", "startedAt": "...", "pipelineVersion": "...",
    "preflight": { "pages": 312, "flags": [...], "gate": "auto|confirmed|bypassed" },
    "documents": [{
      "segment": {"pages": [40, 44]}, "suggestedBlockId": "gov-id", "confidence": 0.93,
      "suggestedName": "2026-05-12_gov-id_dmv_torres.pdf",
      "coreFields": {"document_date": "...", "expiry_date": "...", "primary_party_name": "...", "issuing_party": "..."},
      "scores": {"quality": 0.9, "formatting": 0.85, "fraud_signal": 0.1, "scrutinyTier": "critical"},
      "flags": [{"code": "satisfied_by_alternative", "detail": "..."}],
      "extractions": [],  // always present; empty in v1, populated in v2 (offsets + confidence)
      "artifacts": {"md": "url", "pageRenders": ["..."], "crops": ["..."]}
    }],
    "unassigned": [{"pages": [201, 203], "description": "..."}],
    "whisper": ["Split 312 pages into 19 documents; 2 unassigned; 3 flagged."]
}]}
```
- Portal reads it to render triage (stat strip derived from this data, exceptions queue, unassigned bucket, whisper line). Human verdicts stay portal-side; the analyzer never mutates `applications/<id>.json`.
- Analyzer's internal store is an implementation detail; this API is the only integration surface. **No vector index in v1** — the chat/RAG feature it would serve isn't on any v1 surface; don't stub it. The artifact store (md + renders + crops) is the raw material a future index would be built from.

## 6. [v2] Extraction-tier schemas (analyzer-internal, versioned data not code)

Template for all schemas — worked example `bank_statement`: fields `account_holder_name` (cross-doc key), `institution_name`, `account_number_last4`, `statement_period_start/end` (feeds staleness clock), `opening/closing_balance`, `large_deposits[]` (≥$1000); validation (period_end > start; **max period length is schema data per institution/account type — monthly ≈ 35d, quarterly ≈ 95d — never hardcoded**, so legitimate quarterly statements don't flag); 2–3 redacted few-shot examples required before a schema goes active. Remaining five drafted by analogy, all `version: 0.1-draft` until Homium ratifies against real packets. **The list is a ceiling, not a target** — filing, freshness, and fraud are the product; extraction is the exception.

## 7. Build order — v1/v2 cut line

**v1 (the product works end-to-end):**
1. Sidecar contract + `POST /analysis` endpoint + fixture data (portal builds triage immediately)
2. Pre-flight + gate (full-pipeline cost estimate)
3. `parse_document()` + artifact store
4. Split/classify vs pinned template — `docType` exact-match first (portal adds the optional field + builder dropdown now), name-matching fallback for untagged blocks; form-ID hints from day one
5. Judge: core fields + scores + flags (verdict UI confirms dates)
6. Scrutiny rules from block dimensions (incl. substitution + overlap escalation; v1 fraud scope per §2.5)
7. Naming + end-to-end run on one real packet

**v2 (additive only — no contract changes, only population):**
- LangExtract + the six starter schemas (+ precedence rule activates). Current release v1.6.0 (PyPI, Jul 2, 2026); note: Apache 2.0 but *not an officially supported Google product* — no SLA; pin versions and re-verify at v2 kickoff.
- Amount-level cross-doc fraud checks
- md-offset → bbox mapping if review room wants highlight-on-page
- Chat/RAG + vector index over the artifact store

## 8. Integration questions — resolved per portal-agent review

- `docType` additive field: **accepted, v1** — optional string on document blocks + quiet builder dropdown; seed templates get tagged on creation. Untagged blocks fall back to name-matching, so nothing breaks.
- Write-path: **accepted as API-delivered** (§5).
- Pre-flight as first C2 staged state: **accepted**; UX to be reconciled with triage mockups during build.
- Cost visibility: **Originator and above; hidden from Applicant.**
- Projected closing date: **top-level first-class field on the application JSON, portal-owned** — and the *field* is v1 work (one optional field, OpenAPI-first) even though the expiry engine that consumes it comes later. Same reasoning as docType: applications created without it are backfill debt.

No open blockers. v1 step 1 can start.
