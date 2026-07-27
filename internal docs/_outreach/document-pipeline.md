# Sheaf — Document Analysis Pipeline

Technical description of how a drop of files becomes approved, named, citation-backed loan documents.

## Physical outcomes — what happens to documents

Intake accepts anything from a single self-contained PDF to a whole folder of mixed uploads (PDF/JPG/PNG). Three physical workflows result, all resolved by a human in the review-page filmstrip:

1. **Merge** — several uploads (or fragments) that are really one document. The analyzer files them under the same requirement; the filmstrip shows a link badge between the groups and a human accepts or dismisses the merge.
2. **Split** — one large upload containing many documents (a scanned packet). The split stage segments it into separate document groups; each appears as its own card in the filmstrip.
3. **Rename & approve as-is** — a well-structured, self-contained document needs no surgery. It gets a derived canonical name (`<date>_<type>_<issuer>_<party>.pdf`) and can simply be approved.

## Analysis outcomes — what the analyzer asserts

- **Per document (group of pages):** taxonomy label, quality/formatting/fraud scores (0–1), one-line description, flags (findings), core fields (dates, parties), suggested canonical name.
- **Per page:** rendered PNG + thumbnail, markdown transcript, layout-element geometry (JSON, pixel bboxes), OCR confidence, pre-flight flags (blank/low-contrast/duplicate/low-DPI).
- Page artifacts are mechanical outputs of render/parse; document-level assertions come from the split/classify/judge stages on top of them.

## High-level flow

1. **Pre-flight** — millisecond Poppler checks at upload; bad drops rejected whole with a per-file report.
2. **Gate** — files sit as immutable SourceFiles; a human sees the pre-flight report + cost estimate and launches the run.
3. **Analyzer stage 1: Render** — pages → PNGs.
4. **Analyzer stage 2: Parse** — Mistral OCR → markdown + element geometry.
5. **Analyzer stage 3: Split & classify** — page groups → taxonomy labels; merge candidates derived.
6. **Analyzer stage 4: Judge** — multimodal scoring + core fields per document.
7. **Human review** — triage verdicts, filmstrip merge/split/rename decisions, approval.
8. **Materialization** — approved spans cut into fresh PDFs + markdown sidecars under `approved/`.

---

## Pre-flight & intake

- Poppler CLI, per file: `pdfinfo` (validity, page count, encryption → reject), `pdftoppm -r 36` (cheap raster), `pdfimages -list` (embedded scan DPI).
- Raster checks: **blank** (mean/stddev brightness), **low contrast** (stddev < 8), **duplicate** (exact 36-DPI raster hash match), **low DPI** (embedded images < 150 DPI over 200k px).
- JPG/PNG converted in-place to single-page PDFs (`pdf-lib`, 1 px = 1 pt). HEIC/Word/Excel rejected.
- Whole-drop validation is all-or-nothing. Flags are advisory, stored on the file record, echoed to the judge later.
- Accepted files are minted as immutable **SourceFiles** (`sf-XXXXXXXX`, SHA-256, bytes written once). Nothing runs until a human launches it from the pre-flight report (priced per page).

## Analyzer stage 1 — Render

- `pdftoppm -png -r 150` (env `RENDER_DPI`); no image enhancement ever — models see what a human sees.
- Pillow makes a 320 px thumbnail per page.
- Pushed immediately to object storage: `files/<fileId>/pages/p-N.png`, `files/<fileId>/thumbnails/p-N.png`. Worker disk is scratch.

## Analyzer stage 2 — Parse (OCR)

- Whole file to Mistral OCR: `POST /v1/ocr`, model `mistral-ocr-latest`, `include_blocks: true`, page-level confidence.
- Per page: `md/p-N.md` (markdown transcript; tables as markdown tables) and `elements/p-N.json` (typed blocks, pixel bboxes in the page's raster space — the citation geometry). Real excerpt from a W-2 sample:

```json
{
  "source": "mistral-ocr",
  "dimensions": { "dpi": 93, "width": 791, "height": 1023 },
  "confidenceScores": {
    "average_page_confidence_score": 0.9867,
    "minimum_page_confidence_score": 0.1802
  },
  "blocks": [
    {
      "type": "title",
      "top_left_x": 354, "top_left_y": 9,
      "bottom_right_x": 697, "bottom_right_y": 29,
      "content": "# 2025 W-2 and EARNINGS SUMMARY"
    },
    {
      "type": "text",
      "top_left_x": 299, "top_left_y": 394,
      "bottom_right_x": 450, "bottom_right_y": 434,
      "content": "**ELIZABETH A DARLING**\n**2001 CAMPUS DRIVE**\n**PITTSBURGH, PA 15237**"
    }
  ]
}
```

- Block `type` ∈ `title | text | table | image`; block `content` is itself markdown, so structure survives to the UI.
- Page-count mismatch or missing markdown aborts the run loudly — no silent page skips.

## Analyzer stage 3 — Split & Classify

### Split (packet → documents)

- Deterministic pass first: regex form-ID signals (`FORM_ID_SIGNALS`, e.g. "Form 1003", "W-2") in each page's first 1200 chars, plus "Page 1 of Y" counter resets.
- Then ONE text-LLM refinement pass over per-page openings:

```text
These are the opening words of each page of one uploaded loan packet, in order.
Deterministic signals already mark new documents starting at pages: [...].
List ANY ADDITIONAL pages that clearly start a new document (letterhead change,
new statement period, new form). Be conservative — when unsure, do not split.
Answer ONLY JSON: {"additional_starts": [pageNumbers]}
```

- Default text model: `glm-5p2` on Fireworks (`accounts/fireworks/models/glm-5p2`), `max_tokens=4096` (reasoning headroom before the JSON).

### Classify

- One text-LLM call per segment against the lending taxonomy:

```text
Classify this document from a mortgage loan packet.
Valid types: {menu}
Answer ONLY JSON: {"taxonomy_id": "<id or unassigned>", "description": "<one line>"}
Use unassigned when nothing fits — NEVER invent a type.
```

- Malformed output degrades honestly to `unassigned`; backend failures fail the run.

### Merge recommendations

- Derived from classification, not a separate model call: **two open document groups filed under the same requirement (`blockId`) are probably one document.**
- The review filmstrip pairs such groups and renders a link badge between them (adjacent) or a jump badge (separated by other cards, labeled with the partner's page range).
- Resolution is keyed per pair — `<fileId>:p<first>-<last>|<fileId>:p<first>-<last>` — and persists as `merged` (spans combine into one document) or `dismissed` (stay separate, link recorded). A pending recommendation **blocks approval** of either group until resolved.

### Rename

- No LLM: the canonical name is derived from judge `core_fields` — `<document_date>_<blockId-or-type>_<issuing_party>_<party_lastname>.pdf`, slugified. Shown as the card subtitle in the filmstrip; a human can override before approval.

## Analyzer stage 4 — Judge

- Default model: **Claude Sonnet** (`claude-sonnet-4-6` via Anthropic backend; configurable per run plan like every stage).
- One multimodal call per document — all page images attached plus the parsed markdown (truncated to 4000 chars), `max_tokens=1200`. Prompt essence:

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

- The judge is deliberately *independent*: it sees the images, so it audits the OCR rather than trusting it.
- Full audit metadata persisted per judgment (`judge/doc-NN.json`): raw response, model, token counts, latency, prompt version.

### Run mechanics

- Backends pluggable per run plan (Mistral OCR; Fireworks/Novita text; Anthropic judge). Resolution failures are loud — nothing falls back silently.
- Incremental drops re-analyze only new files and merge into the latest run; the newest run is always the whole truth.
- All artifacts file-keyed in object storage: `files/<fileId>/{pages,thumbnails,md,elements}/p-N.*` — a complete immutable audit trail.

---

## Human in the loop

- **Triage** — judge flags arrive as a prioritized worklist; every flag gets an explicit human verdict (nothing auto-resolves).
- **Review** — page or document view, transcript beside the scan; citations use the element geometry to highlight the exact source region.
- **Filmstrip** — the three physical workflows land here: accept/dismiss merges, see splits as separate cards, rename via the derived name. Per-page approve/deny for set-type requirements.
- **Approval** — per document or per page; denied pages remain in the raw record but are excluded from output.

## Raw vs. approved storage

- **Raw (audit trail)** — `applications/<app>/files/<fileId>/`: original bytes, renders, transcripts, elements, judge output. Immutable after intake.
- **Approved (deliverable)** — approval *materializes* a self-contained copy under `applications/<app>/approved/`: a fresh PDF cut from original source bytes (`pdf-lib`, exact approved spans), a markdown sidecar with YAML frontmatter (scores, core fields, per-page transcripts), renumbered thumbnails.
- Final data extraction happens **only** from approved documents.
- Retention: raw `files/` are audit-only, sweepable independently of `approved/`; a 2-year sweep governs application data.
