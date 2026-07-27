# Sheaf — Document Analysis Pipeline

The heart of Sheaf is the **analyzer run**: a staged, model-driven pipeline that turns a pile of scanned pages into classified, scored, citation-backed documents. Everything before it prepares clean input; everything after it is humans deciding on what the analyzer found.

## The Analyzer Run

### Stage 1 — Render

- Poppler's `pdftoppm -png -r 150` rasterizes every page at 150 DPI (configurable via `RENDER_DPI`) — no image "enhancement" is ever applied; models see what a human would see.
- Pillow derives a 320 px-wide PNG thumbnail per page.
- Each artifact is pushed to object storage the moment it exists (`files/<fileId>/pages/p-N.png`, `files/<fileId>/thumbnails/p-N.png`); the worker's disk is scratch only.

### Stage 2 — Parse (OCR)

- The whole file goes to Mistral's OCR endpoint (`POST /v1/ocr`, model `mistral-ocr-latest`) with `include_blocks: true` and page-level confidence scores.
- Per page, two artifacts are stored:
  - `md/p-N.md` — the full markdown transcript (tables come back as GitHub-style markdown tables).
  - `elements/p-N.json` — typed layout blocks with pixel-coordinate bounding boxes in the page's own raster space, plus page dimensions and confidence.
- The elements JSON is the citation geometry: every block carries `top_left_x/y` and `bottom_right_x/y` in pixels at the reported `dpi`, so any fact can be highlighted at its exact source region. Real excerpt from a W-2 sample (`elements/p-1.json`):

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

- Block `type` values include `title`, `text`, `table`, `image` — block content is itself markdown, so structure survives all the way to the UI.
- Page-count mismatches or missing markdown abort the run loudly; no page is ever silently skipped.

### Stage 3 — Split & Classify

- **Split** (document boundary detection) runs rules-first, LLM-second:
  - Deterministic pass: regex signals for known form IDs (`FORM_ID_SIGNALS` — e.g. "Form 1003", "W-2") and "Page 1 of Y" counter resets.
  - Refinement pass: one text-LLM call over the per-page openings resolves boundaries the rules can't see (continuation pages, unlabeled attachments). Reasoning models are given headroom (`max_tokens=4096`) because they think before emitting JSON.
- **Classify**: each resulting segment gets one text-LLM call against the lending `TAXONOMY`, returning a `taxonomy_id` (W-2, URLA/1003, bank statement, pay stub, …). Malformed model output degrades honestly to *unassigned*; backend failures fail the run.
- Split output is a *recommendation* — humans confirm or override merges in review.

### Stage 4 — Judge

- One multimodal call per document: page images + markdown transcript in a single prompt, returning structured JSON:
  - `quality` (0–1) — usable, complete document?
  - `formatting` (0–1) — does it look like what it claims to be?
  - `fraud_signal` (0–1) — tampering/inconsistency indicators.
  - `core_fields` — dates, parties, and other anchor facts.
- Full audit metadata is persisted per judgment (`judge/doc-NN.json`): raw model response, model name, token counts, latency, prompt version.

### Run mechanics

- Model backends are pluggable per run plan — Mistral for OCR; Fireworks/Novita-hosted models for the text and multimodal stages. Resolution failures are loud; nothing falls back silently.
- Incremental drops re-analyze only new files and merge into the latest run — the newest run is always the whole truth.
- All artifacts are file-keyed in object storage (`files/<fileId>/{pages,thumbnails,md,elements}/p-N.*`), forming a complete, immutable audit trail.

---

## Before the run

### Pre-flight (at upload)

- Server-side, milliseconds per file, Poppler CLI: `pdfinfo` (validity, page count, encryption), `pdftoppm` at 36 DPI (cheap raster), `pdfimages -list` (embedded scan DPI).
- Accepts PDF/JPG/PNG only; JPG/PNG are converted in-place to single-page PDFs with `pdf-lib` (1 px = 1 pt). HEIC, Word, Excel rejected.
- Per-page checks on the 36 DPI raster: **blank** (mean/stddev brightness), **low contrast** (stddev < 8), **duplicate** (exact raster hash match), **low DPI** (embedded images < 150 DPI over 200k px area).
- Whole-drop validation is all-or-nothing — one bad file fails the drop with a per-file report.

### Intake & the gate

- Accepted files are minted as immutable **SourceFiles**: stable ID (`sf-XXXXXXXX`), SHA-256 hash, original bytes written once to `files/<fileId>.pdf`.
- Nothing runs automatically: staff see the pre-flight report plus a per-page cost/time estimate and explicitly decide to launch the analyzer.

## After the run — human in the loop

- **Triage** — judge findings arrive as a prioritized worklist; every flag gets an explicit human verdict.
- **Review** — page or document view, transcript beside the scan; citations use the elements geometry to jump to the exact source region.
- **Filmstrip** — analyzer-recommended merges appear as link badges between document groups; humans accept or dismiss each. Unresolved recommendations block approval.
- **Approval** — per document (or per page in set-type requirements); denied pages stay in the raw record but are excluded from output.

## Raw vs. approved storage

- **Raw (audit trail)** — file-keyed under `applications/<app>/files/<fileId>/`: original bytes, renders, transcripts, elements, judge output. Immutable after intake.
- **Approved (deliverable)** — approval *materializes* a self-contained copy under `applications/<app>/approved/`: a fresh PDF cut from original source bytes (`pdf-lib`, exact approved page spans), a markdown sidecar with YAML frontmatter (scores, core fields, per-page transcripts), and renumbered thumbnails.
- Final data extraction happens **only** from approved documents, never raw uploads.
- Retention: raw `files/` are audit-only and sweepable independently of `approved/`; a 2-year retention sweep governs application data.
