# Sheaf — Document Analysis Pipeline

The heart of Sheaf is the **analyzer run**: a staged, model-driven pipeline that turns a pile of scanned pages into classified, scored, citation-backed documents. Everything before it prepares clean input; everything after it is humans deciding what the analyzer found.

## The Analyzer Run

### Stage 1 — Render

- `pdftoppm` rasterizes every page: full-size PNGs at analyzer DPI plus 320 px thumbnails (Pillow).
- These renders feed both the models downstream and the review UI (filmstrip, page viewer).

### Stage 2 — Parse (OCR)

- Mistral's document-OCR API processes each page: returns per-page **markdown transcript** plus **element-level JSON** — every text block with its bounding box.
- The element geometry is what powers click-to-source citations later: any extracted fact can be traced to the exact region on the exact page.

### Stage 3 — Split & Classify

- **Split** — pages are grouped into documents. Deterministic signals go first (known form IDs, "Page 1 of Y" counters resetting); a text-LLM pass then resolves the ambiguous boundaries the rules can't.
- **Classify** — each resulting document segment is labeled against a lending document taxonomy by a text LLM (W-2, URLA, bank statement, …).
- Split output is a *recommendation*, not a verdict — humans confirm or override merges in review.

### Stage 4 — Judge

- A multimodal model reads each document as image + transcript together and returns:
  - **Quality** score (0–1) — is this a usable, complete document?
  - **Formatting** score (0–1) — does it look like what it claims to be?
  - **Fraud signal** (0–1) — tampering and inconsistency indicators.
  - **Core fields** — dates, parties, and other anchor facts.
- Judge findings become the triage worklist; nothing is auto-resolved.

### Run mechanics

- Model backends are pluggable per run plan (Mistral for OCR; Fireworks/Novita for LLM stages); failures are loud, never silently skipped.
- Incremental drops re-analyze only the new files and merge into the latest run — the newest run is always the whole truth.
- Every stage's artifacts (renders, markdown, elements, judge output) are written file-keyed to object storage, forming a complete audit trail.

---

## Before the run

### Pre-flight (at upload)

- Server-side, milliseconds per file, using Poppler CLI (`pdfinfo`, `pdftoppm` at 36 DPI, `pdfimages`).
- Accepts PDF/JPG/PNG only (images converted in-place to single-page PDFs via `pdf-lib`); HEIC, Word, Excel rejected.
- Checks: openable & page count, encrypted → reject, blank pages, low contrast, duplicates (raster hash), low-resolution scans (<150 DPI).
- Whole-drop validation is all-or-nothing — one bad file fails the drop with a per-file report.

### Intake & the gate

- Accepted files are minted as immutable **SourceFiles** (stable ID, SHA-256, bytes written once).
- Nothing runs automatically: staff see the pre-flight report and a per-page cost/time estimate, then explicitly decide to launch the analyzer.

## After the run — human in the loop

- **Triage** — judge findings arrive as a prioritized worklist; each flag gets an explicit human verdict.
- **Review** — page or document view, transcript beside the scan, citations jumping to the exact source region.
- **Filmstrip** — analyzer-recommended merges appear as link badges between document groups; humans accept or dismiss each one. Unresolved recommendations block approval.
- **Approval** — per document (or per page in set-type requirements); denied pages stay in the raw record but are excluded from output.

## Raw vs. approved storage

- **Raw (audit trail)** — file-keyed under `applications/<app>/files/<fileId>/`: original bytes, renders, transcripts, elements, judge output. Immutable after intake.
- **Approved (deliverable)** — approval *materializes* a clean copy under `applications/<app>/approved/`: a new PDF cut from original source bytes for exactly the approved spans, plus a markdown sidecar (scores, core fields, transcripts) and thumbnails. Self-contained.
- Final data extraction happens **only** from approved documents, never raw uploads.
- Retention: raw `files/` are audit-only and sweepable independently of `approved/`; a 2-year retention sweep governs application data.
