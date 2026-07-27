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
4. **Analyzer stage 2: Parse** — Mistral OCR (`mistral-ocr-latest`) → per-page markdown transcript + element geometry JSON.
5. **Analyzer stage 3: Split & classify** — document boundaries detected (rules, then one LLM pass), each segment labeled against the taxonomy; same-requirement groups become merge recommendations.
6. **Analyzer stage 4: Judge** — one multimodal call per document (Claude Sonnet by default): scores, flags, core fields.
7. **Human review** — three sub-steps:
   a. **Triage** — every flag gets a recorded verdict (accept / dismiss / defer / incomplete).
   b. **Review reading** — transcript beside the scan; citations highlight the exact source region via element bboxes.
   c. **Filmstrip decisions** — resolve merges, file unassigned spans, per-page approve/deny (set blocks), approve documents. Pending merge recommendations block approval.
8. **Materialization (on approval)** — the approved page span is cut from the *original* source bytes into a fresh PDF, with a markdown sidecar (scores, fields, transcripts) and renumbered thumbnails, under `approved/`.

Run lifecycle is tracked on the application record: `gated` (awaiting the start decision) → `processing` (worker active) → `report` (landed or failed — failures are explicit, never silent).

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

- One request per file: `POST /v1/ocr` to Mistral, model [`mistral-ocr-latest`](https://mistral.ai/news/mistral-ocr) ([API docs](https://docs.mistral.ai/capabilities/OCR/basic_ocr/)), `include_blocks: true`, page-level confidence scores.
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
- One multimodal call per document: all page PNGs attached + parsed markdown (truncated to 4000 chars), `max_tokens=1200`. Prompt essence:

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

- The judge is deliberately independent: it sees the raw images, so it audits the OCR rather than trusting it.

> Code: prompt & call `services/analyzer/judge.py`; defaults `services/analyzer/config.py` + `services/analyzer/models.py`

---

## Human review (detail)

- **Triage** — each judge flag becomes a worklist item; the reviewer records a verdict: accept, dismiss, defer, or incomplete. Verdicts are human-only; nothing auto-resolves.
- **Review reading** — page mode or document mode, priority-ordered; transcript rendered beside the scan; clicking a citation highlights the source bbox from `elements/p-N.json`.
- **Filmstrip** — one card per suggested document (title = requirement, subtitle = derived name). Actions: resolve merge recommendations, file unassigned spans to a requirement or archive, per-page approve/deny inside set-type requirements, approve whole documents.
- **Approval trigger** — an accepted verdict (or per-page decisions on set blocks) calls the materialization path server-side; failures surface as explicit materialization errors on the application, never swallowed.

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
