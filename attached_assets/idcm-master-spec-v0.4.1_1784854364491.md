# IDCM Master Spec — v0.4.1

**Audience:** the AI agent (or developer) building v1. This document is the source of truth. Supersedes v0.2/v0.3/v0.4.

**Product center of gravity:** this product's job is to **split, classify, name, file, freshness-check, and fraud-score** documents. Deep field extraction is a supporting feature for a minority (~10–20%) of high-value document types — not the core. Build priorities and cost trade-offs should reflect that ordering.
**Context:** compliance document manager for home-loan packets (300+ page merged PDFs from originators). Prototype on Replit. Compliance hardening deferred — but audit trails are built in from day one because they're cheap now and impossible to retrofit.

---

## 0. Locked Decisions

1. **Parser: PaddleOCR-VL 1.6** — two-stage: PP-DocLayoutV3 layout analysis on our worker, region crops recognized by a hosted VL endpoint. MinerU is the tested fallback; parser lives behind one internal interface (`parse_document(file) -> ParseResult`) so swapping is config, not code.
2. **Single parse** — no dual-parser consensus in v1. The judge's page-image review is the independent check.
3. **Pre-flight is a human gate** — cheap deterministic checks at upload → report → user confirms before the expensive pipeline runs. **Auto-proceed rule: fewer than 20 pages AND zero red flags → skip confirmation and process.** Everything else waits.
4. **Worst-page thumbnails are free** — pre-flight checks emit numeric scores per page (blur variance, skew angle, DPI, contrast); "worst pages" = sort ascending, take bottom 2, plus 1 top-scoring page for contrast. No model calls in pre-flight, ever.
5. **Three-tier taxonomy** — Tier 1: full extraction schemas. Tier 2: recognized types, no schema (classified + described + scored only). Tier 3: unknown/"other" (parsed + described, human assigns). Schemas accrete over time; Tier 3 traffic tells us which schemas to build next.
6. **Universal core fields, extracted by the judge — not LangExtract.** Every document, regardless of tier, yields 3–4 micro-fields as extra keys in the Basic Analysis JSON the judge already produces: `document_date` (or period end), `primary_party_name`, `expiry_date` (if any), `issuing_party` (if visible). Zero additional model calls. These power the three core features: **naming** (`2026-05_bank-statement_chase_smith.pdf`), **freshness/alarm bells** (dates), and **cross-document consistency for fraud** (names/parties). Full LangExtract schemas remain Tier-1 only.
7. **Human override is absolute** — every AI output is a suggestion with confidence; drag-and-drop reassignment wins; all overrides recorded.

---

## 1. End-to-End Flow

1. **Intake** — drop files / link Drive / direct-to-slot. Original stored immutable in object storage.
2. **Pre-flight check** (deterministic, milliseconds/page) → per-page scores + file-level checks.
3. **Gate** — auto-proceed if <20 pages and clean; otherwise show Pre-Flight Report → `Process` / `Process anyway` / `Request better version` (pre-drafts stakeholder email).
4. **Parse** — PaddleOCR-VL 1.6 → md + structured JSON + region crops + page renders, saved to the document's artifact folder.
5. **Split & classify** — deterministic signals first (page-number resets, "Page X of Y", letterheads, form IDs), LLM for ambiguous boundaries; each segment classified against the taxonomy (Tier 3 "other" if no match) → document records.
6. **Judge** — frontier multimodal API (prototype; swap to self-hosted Qwen3-VL later): page image + md + pre-flight flags → quality/formatting/fraud-signal scores, legibility zoning, per-page description, **universal core fields (document_date, primary_party_name, expiry_date, issuing_party)**, all in the Basic Analysis JSON. Flagged regions → deep-analysis queue (crop + re-scan).
7. **Extract** — LangExtract, **Tier-1 documents only (~10–20% of volume)**: md + type schema → fields with character offsets (grounding), confidence, normalized values. All other documents rely on the judge's universal core fields alone.
8. **Store** — fields → Postgres; md chunks + page descriptions → pgvector (namespace per application); rolling context md per application appended.
9. **Compliance engine** — map documents/fields to the application's checklist → gaps, recency checks, alarm bells (90/30/7 days).
10. **Action engine** — per-stakeholder recommendations (request re-scan, request signature, request updated statement) with pre-drafted messages.
11. **Chat** — RAG over the application's pgvector namespace + extracted fields; answers cite document + page + link to source.

---

## 2. Pre-Flight (build spec)

**Checks — file level:** format validity, corruption, encryption, page count, metadata snapshot (producer, creator, created/modified dates — stored for the fraud pass, not evaluated here).
**Checks — per page (OpenCV + PDF libs):** blur (variance of Laplacian), skew angle, effective DPI, contrast histogram, blank detection, duplicate detection (exact hash + perceptual hash), margin-content risk.
**Output:** `preflight_reports` row + per-page score records.
**Report UI:** filename · pages · est. cost $ · est. time · verdict line · 3 thumbnails (worst 2 + best 1; selection strategy configurable) · plain-language flag list ("p.41–43 below 150 DPI") · three buttons.
**Rules:** flags travel with pages as metadata into the judge prompt. No image enhancement before parsing — gate, don't retouch.

## 3. Parser (build spec)

- Wrap in `parse_document()`; run PP-DocLayoutV3 client pipeline in the background worker; VL recognition via OpenAI-compatible endpoint (env-configured: official Baidu token API / Novita / SiliconFlow / self-hosted vLLM). Verify 1.6 availability on the chosen host; fall back 1.5 if needed.
- Save per document: raw md (immutable) · elements JSON (types, boxes, reading order) · every region crop (deep analysis consumes these) · page renders · config + model version + timings.
- **Week-1 validation checklist:** page numbers/headers/footers present in output; seal/stamp regions emitted; table HTML consumable downstream; real 300-page packet timed and priced.

## 4. Extraction (build spec)

> **Scope note:** LangExtract runs on Tier-1 documents only — expected ~10–20% of volume. It is not the product's center of gravity; naming, freshness, and fraud consistency run off the judge's universal core fields (Decision 6) for every document. Do not expand LangExtract coverage to solve those problems.

- LangExtract, one schema per Tier-1 type, few-shot enforced. Model backend env-configured (cloud for prototype).
- Store per field: raw value, normalized value, character offsets, confidence, schema + model versions.
- Validation per field (regex/range); failures → `needs_review`. Cross-doc key fields feed the consistency check.
- Normalization: dates → ISO-8601, money → integer cents, names → canonical form (exact match v1; fuzzy matching is a flagged future decision).

---

## 5. Taxonomy · Checklists · Schemas

Three distinct objects — do not conflate them:

- **Taxonomy** — the master vocabulary of document *types* the classifier can output. One global list.
- **Checklist template** — which taxonomy types a given workflow (product line × state × fund) *requires*, in what quantity, from which stakeholder. Instantiated per application.
- **Schema** — for a Tier-1 taxonomy type, the fields LangExtract must extract.

### 5.1 Worked example (the template for everything else)

**Taxonomy entry — `bank_statement`:**
```yaml
id: bank_statement
tier: 1
display_name: Bank Statement
category: financial
typical_producer: applicant
detection_hints: ["statement period", "account summary", "beginning balance",
                  "ending balance", bank letterhead/logo region]
critical: false            # critical types always get effort=high + full judge review
recency_window_days: 90    # drives alarm bells from statement_period_end
alarm_tiers_days: [90, 30, 7]
```

**Schema — `bank_statement` (v0 placeholder, Homium to ratify):**
```yaml
schema_for: bank_statement
version: 0.1-draft
fields:
  - {name: account_holder_name, type: string, required: true, cross_doc_key: true}
  - {name: institution_name,    type: string, required: true}
  - {name: account_number_last4,type: string, required: true, validate: '^\d{4}$'}
  - {name: statement_period_start, type: date, required: true}
  - {name: statement_period_end,   type: date, required: true,
     note: feeds recency alarm}
  - {name: opening_balance, type: money, required: true}
  - {name: closing_balance, type: money, required: true}
  - {name: large_deposits,  type: list, required: false,
     item: {date: date, amount: money, description: string},
     note: deposits >= $1000; underwriting reviews sourcing}
validation:
  - statement_period_end > statement_period_start
  - period length <= 62 days
few_shot: 2-3 redacted real examples per schema, stored beside it; REQUIRED
          before the schema is marked active (LangExtract is example-driven).
```

**Checklist template line (how a workflow references the taxonomy):**
```yaml
workflow: purchase_loan / CO / fund_x
requires:
  - {type: bank_statement, count: 2, note: "two most recent months",
     stakeholder: applicant,
     recency: from statement_period_end, window_days: 90}
```

### 5.2 Builder instructions — generate the rest from this template

1. **Starter taxonomy (~20 entries).** Create entries following §5.1's shape for:
   - **Tier 1 (schema now):** application_form, bank_statement, pay_stub, w2_or_tax_return, government_id, property_deed
   - **Tier 2 (entry only, no schema):** appraisal_report, purchase_agreement, homeowners_insurance, title_report, employment_verification_letter, gift_letter, credit_report, closing_disclosure, mortgage_note, flood_certificate, criminal_record_check, divorce_decree_or_support_order
   - **Tier 3:** single fallback entry `other_unclassified`
2. **Draft the 5 remaining Tier-1 schemas** by analogy with bank_statement: identify the 5–10 fields a compliance reviewer actually checks, mark cross_doc_key on any name/address/SSN-last4/amount that must reconcile across documents, add per-field validation, set recency windows where documents expire (government_id: validity must extend past projected close date).
3. **Mark everything `version: 0.1-draft`.** Nothing is authoritative until Homium reviews against real packets. Build the review step into the admin UI: show each schema next to a real extracted example, one-click approve/edit.
4. **Tier promotion loop:** when Tier-2/Tier-3 volume for a type crosses a threshold (suggest: 10 documents), surface "this type is common — draft a schema?" in the admin UI. Schemas accrete; the taxonomy is append-only.
5. **Tier-1 is a ceiling, not a target.** The six Tier-1 types may shrink if Homium ratifies fewer; keep the promotion threshold conservative (10+ documents AND a demonstrated need for specific field values, not just volume). Filing, freshness, and fraud scoring are the product; extraction is the exception.
6. **Classifier contract:** the classifier may ONLY output taxonomy ids (or `other_unclassified`). Detection_hints seed the classifier prompt; human reassignments are logged and periodically reviewed to improve hints.

---

## 6. Data Model (Postgres + pgvector, one database)

`applications` (workflow ref, status) · `checklist_items` (per app, taxonomy type, required count, stakeholder, deadline state) · `uploads` (original files) · `preflight_reports` + `page_scores` · `documents` (app id, taxonomy id, tier, page range, status, scores) · `pages` (md ref, image ref, scores, flags) · `extractions` (field, raw, normalized, offsets, confidence, needs_review; includes judge-sourced universal core fields tagged `source=judge` vs `source=langextract`) · `chunks` (embedding, text, app/doc/page refs) · `context_docs` (rolling md per application) · `actions` (recommendation, stakeholder, status, drafted message) · `overrides` (who, what, before/after, when) · `schemas` + `taxonomy` (versioned rows, not code)

## 7. App Skeleton (unchanged from stack doc)

Next.js UI (checklist view, drop zone, pre-flight report, drag-and-drop reassignment, admin schema review) · FastAPI + background workers (Celery/Redis or Replit-native queue) · Postgres + pgvector · object storage (S3-compatible) · all model calls behind env-configured endpoints.

## 8. Build Order (for the agent)

1. Schema/taxonomy tables + seed from §5.2 → 2. Upload + pre-flight + gate UI → 3. `parse_document()` with Paddle endpoint + artifact folders → 4. Split/classify against taxonomy → 5. Judge integration + Basic Analysis JSON → 6. LangExtract for the 6 Tier-1 schemas → 7. Checklist instantiation + gap view + alarm bells → 8. Action drafts + override recording → 9. pgvector ingestion + application chat.
Each step shippable and testable on one real packet before the next begins.

## 9. Remaining Open Questions

- **Q-endpoint:** which VL host (Baidu token API / Novita / SiliconFlow / self-host) — settle with a 1-hour latency + price + 1.6-availability test.
- **Q-cost-display:** show $ estimates to external originators or internal only?
- **Q-fuzzy-names:** exact name matching v1; when to allow fuzzy ("J. Smith" = "John Smith")?
- Schema ratification by Homium is ongoing work, not a blocker — the tier system means the pipeline runs usefully on day one.
