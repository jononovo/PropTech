# Sheaf — Document Analysis Pipeline

Technical reference: what happens to every uploaded document — analysis, human review, storage — stage by stage, exact to the code.

## Physical outcomes — the three document workflows

Intake accepts anything from one self-contained PDF to a folder of mixed uploads (PDF/JPG/PNG). The analysis produces *recommendations*; a human executes them with single clicks in the review-page filmstrip:

1. **Merge (recommended, human-confirmed)** — the analysis flags that two separately-uploaded documents (or fragments) appear to be parts of the same document — both classified under the same requirement. The filmstrip draws a link badge between the two groups; the reviewer views both with one click and decides: merge into one document, or dismiss (they stay separate, the decision is recorded).
2. **Split (recommended, human-approved)** — often a single uploaded PDF contains multiple different documents of the same application (a scanned packet). The analysis detects where each document begins and ends and presents them as separate cards; the reviewer approves each as its own document.
3. **Rename & approve as-is** — a well-structured, self-contained document needs no surgery. The analysis derives a canonical filename from its extracted fields (`<date>_<type>_<issuer>_<party>.pdf`); the reviewer can override the name and approve directly.

> Code: filmstrip UI `artifacts/client/src/features/case-file/review/approval/DocGroupsStrip.tsx`; merge/split/group model `…/approval/docGroups.ts`

## Analysis outcomes — what a run creates

### Per page (mechanical artifacts, created during render + parse)

- `files/<fileId>/pages/p-N.png` — full render at 150 DPI, shown in the review-page viewer and sent to the judge model.
- `files/<fileId>/thumbnails/p-N.png` — 320 px-wide preview for the filmstrip.
- `files/<fileId>/md/p-N.md` — OCR markdown transcript (tables preserved as markdown tables).
- `files/<fileId>/elements/p-N.json` — layout blocks with pixel bounding boxes + OCR confidence (citation geometry).
- All keys are file-keyed under `applications/<storageFolder>/` in object storage, pushed the moment they exist; the worker's disk is scratch.

> Code: storage layout & keys `artifacts/api-server/src/lib/packetObjectStore.ts`

### Per document (assertions, created during split + classify + judge)

- Page span — which pages of which file form this document.
- `taxonomy_id` — label from the lending taxonomy (W-2, URLA/1003, bank statement, …) or honest `unassigned`.
- Scores 0–1: `quality`, `formatting`, `fraud_signal`.
- `flags` — findings, each requiring a human verdict in triage.
- `core_fields` — `document_date`, `expiry_date`, `primary_party_name`, `issuing_party`.
- Suggested canonical name derived from core fields (no LLM; slugified).
- Full judge audit record at `judge/doc-NN.json`: raw model response, model name, tokens, latency, prompt version.

> Code: run orchestration `services/analyzer/runner.py`; run record & ingest `artifacts/api-server/src/features/analysis/router.ts`

## High-level flow

1. **Pre-flight** — Poppler CLI checks each dropped file in milliseconds (readable? encrypted? blank/low-contrast/duplicate pages? low-res scans?). One failing file rejects the whole drop, with a per-file explanation so the user fixes and re-drops.
2. **Pre-flight report & analysis options** — accepted files are stored immutably; staff see the per-file flags plus a cost/time estimate (`GET /run/estimate` → USD + minutes, priced per page) and explicitly start the run (`POST /run/gate`).
3. **Analyzer stage 1: Render** — each page → a 150 DPI PNG (review viewer + judge input) and a 320 px thumbnail (filmstrip).
4. **Analyzer stage 2: Parse** — Mistral OCR 4 (`mistral-ocr-latest`) → per-page markdown transcript + element geometry JSON.
5. **Analyzer stage 3: Split & classify** — document boundaries detected (rules, then one LLM pass), each segment labeled against the taxonomy; same-requirement groups become merge recommendations.
6. **Analyzer stage 4: Judge** — one multimodal call per document (Claude Sonnet by default): scores, flags, core fields.
7. **Human review** — three sub-steps:
   a. **Triage** — every flag gets a recorded verdict (accept / dismiss / defer / incomplete).
   b. **Review reading** — transcript beside the scan; citations highlight the exact source region via element bboxes.
   c. **Filmstrip decisions** — resolve merges, file unassigned spans, per-page approve/deny (set blocks), approve documents. Pending merge recommendations block approval.
8. **Materialization (on approval)** — the approved page span is cut from the *original* source bytes into a fresh PDF, with a markdown sidecar (scores, fields, transcripts) and renumbered thumbnails, under `approved/`.

Run lifecycle is tracked on the application record: `gated` (awaiting the start decision) → `processing` (worker active) → `report` (landed or failed — failures are explicit, never silent).

Incremental drops re-run only the new files; the result merges into the latest run at ingest, so the newest run is always the whole truth. Every model stage is pluggable per run plan (Mistral for OCR; Fireworks / Novita / Anthropic backends for the text and judge stages) — an unknown or unavailable option fails the run loudly before any spend, never a silent substitution.

## Call graph — what runs in order, what's lumped into one query

The whole run is **strictly sequential** — one straight line of awaited calls, no parallel fan-out. That is deliberate: each stage's output is the next stage's input (parse → boundaries → segments → classification → judge inputs), costs stay linearly predictable for the pre-run estimate, and per-stage timings (`renderMs`, `parseMs`, `splitClassifyMs`, `judgeMs`) are recorded cleanly in the run's `config.json`.

For a run with **F** files and **D** detected documents, the exact model-call count is:

| # | Step | Model calls | Granularity & what's lumped together |
|---|---|---|---|
| 1 | Render + thumbnails | 0 | Local Poppler/Pillow, per file in receipt order |
| 2 | Parse (OCR) | **F** | ONE call per *file* — the whole PDF in a single request; all pages' markdown + geometry come back together |
| 3 | Boundary refinement | **1** | ONE call for the *entire run* — the openings of every page of every file in one prompt; the model only adds boundaries the rules missed |
| 4 | Classify | **D** | ONE call per *segment* (first-page text only) |
| 5 | Judge | **D** | ONE call per *document* — scores + flags + description + core fields all from this single query, never separate calls |
| 6 | Scrutiny + deep scan | 0 | Pure code, after all judges finish — tiers, substitution escalation, cross-document consistency |
| 7 | Satisfaction pass | ≤ set blocks | ONE call per *set-type requirement* that received documents (expert read: piles, gaps) — runs last, over judge outputs |

So a typical 3-file, 7-document packet costs exactly 3 + 1 + 7 + 7 = **18 model calls**, in that order. Steps 4–5 interleave per document (classify segment N, judge segment N, move on) rather than batching all classifications first. Rules always run before models (deterministic split signals before the refinement call), and cheap text calls run before the expensive multimodal judge — a segment classified `unassigned` is never judged at all.

> Code: the entire sequence is one function — `services/analyzer/runner.py` (`_pipeline`)

---

## Pre-flight & intake (detail)

- Tools ([Poppler](https://poppler.freedesktop.org/) CLI — the standard open-source PDF toolkit): `pdfinfo` (validity, page count, encryption → reject), `pdftoppm -r 36` (cheap raster for pixel checks), `pdfimages -list` (embedded scan DPI).
- Raster checks per page: **blank** (mean/stddev brightness), **low contrast** (stddev < 8), **duplicate** (exact 36-DPI raster hash match within the drop), **low DPI** (embedded images < 150 DPI covering > 200k px).
- JPG/PNG are converted in-place to single-page PDFs with [`pdf-lib`](https://pdf-lib.js.org/) (pure-JS PDF creation/editing; 1 px = 1 pt) so everything downstream is PDF. HEIC/Word/Excel rejected at the door.
- Accepted files are minted as immutable **SourceFiles**: stable ID `sf-XXXXXXXX`, SHA-256 hash, original bytes written once to `files/<fileId>.pdf`. Flags are advisory — stored on the record, shown in the intake UI, and echoed to the judge.

> Code: checks `artifacts/api-server/src/features/files/preflight.ts`; intake seam (minting, image conversion, all-or-nothing) `…/files/receive.ts` + `…/files/imageToPdf.ts`; estimate & start `…/analysis/router.ts`; intake UI `artifacts/client/src/features/case-file/lenses/IntakePage.tsx`

## Analyzer stage 1 — Render

- `pdftoppm -png -r 150` ([Poppler](https://poppler.freedesktop.org/); DPI via env `RENDER_DPI`). No image "enhancement" is ever applied — models see exactly what a human sees.
- Thumbnails via [Pillow](https://pillow.readthedocs.io/) (the standard Python imaging library): 320 px-wide PNG per page.
- Both are uploaded to the API per page as they're produced (`PUT /files/:fileId/artifacts/:page?kind=pages|thumbnails`), which writes them to object storage. Served back at `GET /files/:fileId/pages/:page` (full) and `?size=thumb` (filmstrip).

> Code: rendering `services/analyzer/pdfs.py`; artifact upload/serve routes `artifacts/api-server/src/features/analysis/router.ts`

## Analyzer stage 2 — Parse (OCR)

### The model — Mistral OCR

- We use [**Mistral OCR 4**](https://mistral.ai/news/ocr-4/) (API alias `mistral-ocr-latest`, so we always ride the current release). It is a purpose-built document-understanding model — not a general LLM asked to transcribe — that returns structured **markdown** (headings, tables, checkboxes survive as markdown, not flat text) plus per-block layout geometry in one pass. It leads OCR benchmarks on exactly our failure modes: scanned forms, dense tables, handwriting, and skewed phone photos, at thousands of pages per minute. That combination — transcript *and* pixel-anchored geometry from a single call — is what makes our click-to-source citations possible.
- Accessed **directly from Mistral's own API** (La Plateforme, [API docs](https://docs.mistral.ai/capabilities/document_ai/)) — no intermediate hosting provider. The whole PDF is sent as a base64 `document_url` in one `POST /v1/ocr` request per file, with `include_blocks: true` for geometry and page-level confidence scores.
- Response is per-page: markdown → `md/p-N.md`, layout blocks → `elements/p-N.json`. Real excerpt (W-2 sample):

```json
{
  "source": "mistral-ocr",
  "dimensions": { "dpi": 93, "width": 791, "height": 1023 },
  "confidenceScores": { "average_page_confidence_score": 0.9867 },
  "blocks": [
    { "type": "title",
      "top_left_x": 354, "top_left_y": 9,
      "bottom_right_x": 697, "bottom_right_y": 29,
      "content": "# 2025 W-2 and EARNINGS SUMMARY" },
    { "type": "text",
      "top_left_x": 299, "top_left_y": 394,
      "bottom_right_x": 450, "bottom_right_y": 434,
      "content": "**ELIZABETH A DARLING**\n**2001 CAMPUS DRIVE**\n**PITTSBURGH, PA 15237**" }
  ]
}
```

- Coordinates are pixels in that page's own raster space at the reported `dpi`; block `type` ∈ `title | text | table | image`; block `content` is markdown, so structure survives to the UI.
- Guardrails: page-count mismatch between PDF and OCR response, or a page with no markdown, aborts the run loudly. No silent skips.

> Code: `services/analyzer/mistral_ocr_parse.py`; parse dispatch `services/analyzer/parse.py`

## Analyzer stage 3 — Split & Classify

### Split (one file → many documents)

- Rules first: regex form-ID signals (`FORM_ID_SIGNALS` — "Form 1003", "W-2", …) in each page's first 1200 chars, plus "Page 1 of Y" counter resets.
- Then exactly ONE text-LLM refinement call over the per-page openings:

```text
Deterministic signals already mark new documents starting at pages: [...].
List ANY ADDITIONAL pages that clearly start a new document (letterhead change,
new statement period, new form). Be conservative — when unsure, do not split.
Answer ONLY JSON: {"additional_starts": [pageNumbers]}
```

- Default text model: [GLM](https://z.ai/) `glm-5p2` served on [Fireworks AI](https://fireworks.ai/models); `max_tokens=4096` (reasoning headroom before the JSON).

> Code: `services/analyzer/split_classify.py` (split + classify); taxonomy `services/analyzer/taxonomy.py`; model resolution `services/analyzer/models.py`

### Classify

- One text-LLM call per segment:

```text
Classify this document from a mortgage loan packet.
Valid types: {menu}
Answer ONLY JSON: {"taxonomy_id": "<id or unassigned>", "description": "<one line>"}
Use unassigned when nothing fits — NEVER invent a type.
```

- Malformed output degrades honestly to `unassigned`; backend failures fail the run.

### Merge recommendations

- Derived from classification, no extra model call: **two open document groups filed under the same requirement are flagged as probably one document.**
- Each pair gets a stable resolution key — `<fileId>:p<first>-<last>|<fileId>:p<first>-<last>` — persisted as `merged` (spans combine) or `dismissed` (stay separate, decision recorded). Pending pairs block approval of either group.

> Code: pairing rule & keys `artifacts/client/src/features/case-file/review/approval/docGroups.ts`; persistence `artifacts/api-server/src/features/merge-resolutions/`

### Rename

- No LLM: `<document_date>_<blockId-or-type>_<issuing_party>_<party_lastname>.pdf`, slugified from judge core fields. Shown as the filmstrip card subtitle; human-overridable before approval.

> Code: `services/analyzer/naming.py` (`derive_name`)

## Analyzer stage 4 — Judge

- Default model: [Claude Sonnet](https://www.anthropic.com/claude/sonnet) (`claude-sonnet-4-6`, [Anthropic API](https://docs.anthropic.com/)) — configurable per run plan like every stage.
- **One multimodal call per document** — everything below (three scores, description, flags, core fields) comes out of this single query, not separate calls. Inputs: the segment's page PNG renders (first page, plus last page for multi-page docs) + parsed markdown (truncated to 4000 chars) + the taxonomy suggestion + any pre-flight flags touching those pages. `max_tokens=1200`. Prompt essence:

```text
You are the independent judge in a mortgage document pipeline. You see page
image(s) of ONE document plus its machine-parsed markdown. Assess honestly.
Document type suggestion: {taxonomy label}
Pre-flight flags touching these pages: {flags}
Parsed markdown (may be imperfect — you are the check on it): {md}
Answer ONLY JSON: { "quality": 0.0-1.0, "formatting": 0.0-1.0,
  "fraud_signal": 0.0-1.0, "description": "...", "flags": [...],
  "core_fields": { "document_date", "expiry_date",
                   "primary_party_name", "issuing_party" } }
```

- The judge is deliberately independent: it sees the raw images, so it audits the OCR rather than trusting it. `Only report what you can actually see. Do not invent dates or names.` closes the prompt.

### The scores — exact criteria, and who computes what

| Score | Criterion (verbatim from the prompt) | Computed by |
|---|---|---|
| `quality` | "legibility/scan quality of the document itself" — is the scan readable, regardless of content | Judge (visual) |
| `formatting` | "is it complete & well-formed for its type (all pages, signatures, fields)" — completeness relative to the taxonomy suggestion it was handed | Judge (visual + transcript) |
| `fraud_signal` | "visual anomalies only: inconsistent fonts, misaligned edits, pasted regions. 0 = nothing suspicious" | Judge (visual) |
| `confidence` | NOT a model output — deterministic: 0.9 when the segment's taxonomy label exactly matches the target requirement's `docType`, 0.7 for a name-similarity match | Runner (code) |

- Score handling: values are clamped to [0,1]; a non-numeric value degrades to 0.5 (quality/formatting) or 0.0 (fraud) — never a crash, never an invented extreme.
- `fraud_signal` is toggleable per run plan. When off, the line is removed from the prompt AND the output — the score is **absent**, never a fake 0 — and the recorded prompt version gets a `-nofraud` suffix so the audit trail shows exactly which prompt ran.

### How the anti-fraud analysis actually works — two layers

**Layer 1 — visual, per document (the judge call above).** The judge sees the untouched 150 DPI renders (no enhancement is ever applied) and scores *visual* tamper evidence only: font changes mid-document, misaligned pasted regions, edit seams. It is scoped this way on purpose — v1 explicitly excludes amount-level checks (e.g. recomputing pay-stub math); that's a v2 item.

**Layer 2 — deterministic, cross-document (no LLM, pure code).** After all judge calls finish, scrutiny rules run over the whole workfile:

- **Scrutiny tier** — each document inherits `supporting | standard | critical` from its requirement's declared criticality.
- **Substitution scrutiny** — a document filed as an *alternative* satisfying a critical primary requirement is escalated one tier and flagged `satisfied_by_alternative` (the classic weak spot: substituting a bank letter for the document that was actually required).
- **Deep-scan triggers** — a cross-document scan fires when any of: a critical + scarce-sourcing requirement is filed; a critical requirement was satisfied by substitution; ≥ 2 critical documents in one section scored quality < 0.6.
- **Deep scan (v1 scope)** — consistency checks across documents: `party_mismatch` (a document's `primary_party_name` shares no name token with the applicant) and `date_inconsistency` (expiry precedes document date). Findings are appended as flags on the documents involved — every one lands in the triage worklist for a human verdict.

> Code: layer 2 entirely in `services/analyzer/scrutiny.py` (`apply_substitution_scrutiny`, `needs_deep_scan`, `deep_scan`)

### Core-field extraction — the judge, not the classifier

- The classifier only answers *what type is this* (taxonomy id + one-line description). All four core fields — `document_date`, `expiry_date`, `primary_party_name`, `issuing_party` — come from the **judge call**, read off the page images.
- Field rules: dates must be printed on the document (`expiry_date` is omitted, not guessed, if absent); unknown `primary_party_name` falls back to the application's applicant name; fields are *ungrounded* in v1 (no bbox citation), which is why the verdict UI makes a human confirm the dates before they drive expiry clocks.
- These fields then feed the no-LLM rename (stage above) and the deep scan's consistency checks.

### Reliability & audit

- Malformed JSON output triggers exactly one retry (a lost document is contract-critical; a whole-run failure is worse). A second failure fails the run loudly.
- Every judge call writes a write-once audit artifact `judge/doc-NN.json`: the **raw untruncated model response**, model + backend, prompt version, fraud-scoring flag, token counts exactly as the API reported them (never estimated), and latency. Every score a human sees stays traceable to the exact model output that produced it.

> Code: prompt & call `services/analyzer/judge.py`; per-document loop & audit write `services/analyzer/runner.py`; defaults `services/analyzer/config.py` + `services/analyzer/models.py`

---

## Human review (detail)

- **Triage** — each judge flag becomes a worklist item; the reviewer records a verdict: accept, dismiss, defer, or incomplete. Verdicts are human-only; nothing auto-resolves.
- **Review reading** — page mode or document mode, priority-ordered; transcript rendered beside the scan; clicking a citation highlights the source bbox from `elements/p-N.json`.
- **Filmstrip** — one card per suggested document (title = requirement, subtitle = derived name). Actions: resolve merge recommendations, file unassigned spans to a requirement or archive, per-page approve/deny inside set-type requirements, approve whole documents.
- **Approval trigger** — an accepted verdict (or per-page decisions on set blocks) calls the materialization path server-side; failures surface as explicit materialization errors on the application, never swallowed. Denied pages stay in the raw record — they are only excluded from the approved output, never deleted.

> Code: triage `artifacts/client/src/features/case-file/lenses/TriagePage.tsx`; review `…/review/ReviewPage.tsx` + `…/review/reviewModel.ts`; approval state `…/review/approval/useDocApproval.ts`

## Materialization — raw vs. approved

- Approval cuts the exact approved span from the **original source bytes** (never re-rendered) with [`pdf-lib`](https://pdf-lib.js.org/):

```ts
const indices = Array.from({ length: last - first + 1 }, (_, i) => first - 1 + i);
const pages = await out.copyPages(src, indices);
for (const p of pages) out.addPage(p);
```

- Output under `applications/<storageFolder>/approved/`:
  - `<basename>.pdf` — basename = `<slug(blockId)>_<slug(document_date || approval date)>`, `_b`/`_c` suffix on collision.
  - `<basename>.md` — sidecar with YAML frontmatter (scores, flags + verdicts, core fields, provenance: source spans, operation, actor, timestamp) followed by per-page transcripts.
  - `<basename>/thumbnails/p-N.png` — source thumbnails copied and renumbered to the document's own 1..N page order. Self-contained: usable without the raw record.
- **Raw** (`files/<fileId>/…`) is the immutable audit trail; **approved** is the deliverable. Final data extraction happens only from approved documents.
- Retention: raw `files/` are audit-only and sweepable independently of `approved/`; a 2-year sweep governs application data.

> Code: span cut & assembly `artifacts/api-server/src/features/approved-docs/materialize.ts`; sidecar frontmatter `…/approved-docs/frontmatter.ts`; retention sweep `artifacts/api-server/src/features/retention/`
