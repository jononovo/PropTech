# Homium Analyzer — Build Spec v0.6.3 (FINAL — supersedes ALL prior copies)

**To the agent building the portal/engine:** this file replaces every earlier spec copy in your repo (`attached_assets/idcm-master-spec-v0.4.1*`, `homium-analyzer-spec-v0.6.2*`) and the parser lines in your `future.md`. Where any older document disagrees with this one, this one wins. Decisions here are current as of **Jul 24, 2026** and verified at source.

---

## 0. Division of authority

| Concern | Owner |
|---|---|
| Template contract (requirement/criticality/sourcing, alternatives, expiry schema), pinned per application | **Portal** |
| Scrutiny depth, substitution scrutiny, overlap escalation, queue ordering (schema-spec §4) | **Portal rules — analyzer implements verbatim** |
| Expiry engine (two-clock model); analyzer only supplies dates | **Portal** |
| Verdicts | **Humans only** — analyzer emits suggestions + confidence |
| Split, classify, name, quality/fraud scoring, artifacts, core fields | **Analyzer (this spec)** |

## 1. Locked decisions

1. **Parser: PaddleOCR-VL 1.6 via Fireworks.ai — using it is just an API.** Deploy the model from Fireworks' library (one click; Fireworks runs all hardware), receive an OpenAI-compatible URL + API key, point `vl_rec_server_url` at it. It **auto-scales to zero by default** when idle and bills per GPU-second only while working — no servers, no Docker, nothing to manage. Two settings at deploy time: `scale-to-zero-window` = 5–10 min (default is 1h of paid idle) and the smallest GPU shape offered. Cold start from idle is a few minutes — irrelevant for batch. Their pay-per-token "serverless" tier does not carry this model; the one-click deployment is the path. **The hosted-1.5 interim is cancelled** (it was chosen on a stale premise). Self-hosted vLLM Docker is break-glass fallback only — otherwise ignore every self-hosted/RunPod/Modal/Docker mention in older documents. Account/URL/key come from the product owner at engine kickoff.
   Client side unchanged: PP-DocLayoutV3 pipeline in the analyzer worker (`paddlepaddle` ≥3.2.1 CPU build, `paddleocr[doc-parser]` ≥3.6.0, `pipeline_version="v1.6"`, `vl_rec_backend="vllm-server"`). Why 1.6: leads OmniDocBench (96.33, self-evaluated) and sets SOTA on Real5-OmniDocBench's five real-world degradations — scanning, warping, screen-photography, illumination, skew — i.e., exactly this product's documents.
2. **Single parse.** The multimodal judge (frontier API; key arrives via app secrets, never chat) reviews page image + parsed md as the independent check.
3. **Pre-flight is a human gate** (built): deterministic checks → report (pages, full-pipeline cost incl. judge, worst-2+best-1 thumbnails, plain-language flags) → `Process` / `Process anyway` / `Request better version`. Auto-proceed: <20 pages AND zero flags. Server-side blocking + per-case concurrency (built and verified). Gate, don't retouch — no image "enhancement" ever.
4. **Universal core fields on every document, from the judge:** `document_date`, `expiry_date?`, `primary_party_name`, `issuing_party?` — these power naming, the portal's clocks, and cross-doc consistency. **Human eyes on every clock (v1):** the verdict UI displays these dates next to accept/reject; accepting a document confirms the date its clock runs on; dates editable at verdict, edits recorded.
5. **Extraction is v2.** LangExtract full-field schemas (~10–20% of volume: bank_statement, pay_stub, w2_or_tax_return, government_id, application_form, property_deed) ship later; the sidecar carries `extractions: []` from day one so v2 is populate-only. Precedence rule (from v2): grounded extraction value beats judge core field; mismatch ⇒ `needs_review`. LangExtract current release v1.6.0 (Jul 2, 2026); Apache 2.0 but not an officially supported Google product — pin versions.
6. **Human override is absolute.** Every AI output is a suggestion with confidence; reassignment wins; all overrides recorded.

## 2. Pipeline (v1)

Intake → pre-flight → gate → parse (Fireworks endpoint; save per document: raw md, elements JSON, region crops, page renders, config+versions) → split/classify (deterministic signals first — page-number resets, "Page X of Y", letterheads, **form IDs: URLA/1003, 1008, W-2, 4506-C, CD, LE** — LLM only for ambiguous boundaries; `docType` exact-match first, name-matching fallback; no match → unassigned) → scrutiny per portal §4 (criticality tiers, substitution scrutiny, overlap escalation → deep scan) → judge (scores, flags, descriptions, core fields) → naming (`<date>_<blockId>_<issuer>_<party>.pdf`, derived never hand-written, human rename wins) → sidecar POST.

**v1 fraud scope, stated plainly:** metadata/structural anomalies + judge visual anomalies + core-field consistency (names/dates/parties). No amount-level checks until v2 extractions. Do not oversell.

## 3. Write-path (built — kept as the record)

`POST /api/applications/{id}/analysis`, body = **one run object**; portal appends and derives `latestRunId` (analyzer stateless toward portal). Portal validates every `suggestedBlockId` against the pinned template; duplicate `runId` rejected (replay protection). **The analyzer service never gets direct database access — this endpoint is its only door**, even though sharing Postgres would be easy. Single-writer boundary; don't blur it.

## 4. v1 / v2 cut

**v1:** sidecar+fixtures ✓ · pre-flight+gate ✓ · docType ✓ · closing-date field ✓ · parse via Fireworks · split/classify · judge (core fields, scores) · scrutiny rules · naming · one real packet end-to-end.
**v2 (additive only):** LangExtract + schemas (+precedence) · amount-level fraud checks · md-offset→bbox highlight mapping (elements JSON already retained) · chat/RAG + vector index over the artifact store.

## 5. Standing answers (so they're written down once)

- **Demo bias:** no fixed date — engine before polish; a real parse of the sample packet is the demo.
- **Data:** scrubbed/synthetic packets only until retention + access controls around stored packets exist. Treat that as a gate, not a preference.
- **Cost visibility:** Originator and above; hidden from Applicant.
- **Closing date:** portal-owned top-level field (exists); edits re-evaluate hard expiries when the expiry engine lands.
- **Judge + Fireworks keys:** provided by the product owner directly into app secrets at engine kickoff.
