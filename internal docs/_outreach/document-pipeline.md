# Sheaf — Document Analysis Pipeline

How a dropped file becomes an approved document: each analysis stage, the human-in-the-loop flow, and raw vs. approved storage.

## 1. Pre-flight (at upload, before anything is stored as accepted)

- Runs server-side on every drop, in milliseconds, using the Poppler CLI toolkit: `pdfinfo`, `pdftoppm` (36 DPI raster), `pdfimages`.
- Accepts PDF, JPG, and PNG only. JPG/PNG are converted in-place to single-page PDFs (`pdf-lib`, 1 px = 1 pt) so everything downstream is PDF. HEIC, Word, and Excel are rejected outright.
- Checks per file:
  - **Openable & page count** — `pdfinfo`; encrypted or corrupt PDFs are rejected.
  - **Blank pages** — raster brightness statistics on the 36 DPI render.
  - **Low contrast** — pixel standard deviation below threshold (likely unreadable scan).
  - **Duplicate** — exact hash match of the low-DPI raster against other pages in the drop.
  - **Low resolution** — `pdfimages` finds large embedded scans below 150 DPI.
- Whole-drop validation is all-or-nothing: one bad file fails the drop with a per-file report, so partial intakes never happen.

## 2. Intake & the gate

- Each accepted file is minted as an immutable **SourceFile**: stable ID, SHA-256 hash, original bytes written once to object storage.
- Pre-flight flags (blank/low-contrast/duplicate/low-DPI) are stored on the file record and surfaced in the intake UI.
- Nothing is analyzed automatically. Files sit behind an explicit **gate**: staff see a pre-flight report with a cost/time estimate (priced per page) and decide when to run the analyzer. Files can be renamed or archived before ever being processed.

## 3. Analyzer run (Python worker)

- **Render** — `pdftoppm` produces full-size page PNGs plus 320 px thumbnails (Pillow).
- **Parse/OCR** — Mistral's document-OCR API returns per-page markdown plus element-level JSON (text blocks with bounding boxes, used later for click-to-source citations).
- **Split** — pages are grouped into documents: deterministic signals first (known form IDs, "Page 1 of Y" resets), then a text-LLM pass to resolve ambiguous boundaries.
- **Classify** — each document segment is labeled against a lending document taxonomy via a text LLM.
- **Judge** — a multimodal model reviews image + transcript per document, scoring **quality**, **formatting**, and **fraud signal** (0–1), and extracting core fields (dates, parties).
- Model backends are pluggable per run plan (Mistral for OCR; Fireworks/Novita for LLM calls); failures are loud, never silently skipped.
- Incremental drops re-run only new files and merge into the latest run, so the newest run is always the whole truth.

## 4. Human in the loop

- **Triage** — findings and judge scores land as a prioritized worklist; each flag gets an explicit human verdict (nothing auto-resolves).
- **Review** — page-by-page or document-level reading with priority ordering, transcripts side-by-side with the scan, and citations that jump to the exact source region.
- **Filmstrip (document assembly)** — analyzer-recommended merges appear as link badges between document groups; a human accepts or dismisses each recommendation. Pending merge suggestions block approval until resolved.
- **Approval** — humans approve per document (or per page within set-type requirements). Denials keep the pages in the raw record but exclude them from the approved output.

## 5. Raw vs. approved storage

- **Raw (audit trail)** — everything lives file-keyed under `applications/<app>/files/<fileId>/`: original bytes, page renders, OCR markdown, element JSON, judge output. Immutable; never edited after intake.
- **Approved (deliverable)** — approval *materializes* a clean copy under `applications/<app>/approved/`: a new PDF cut from the original source bytes for exactly the approved page spans, plus a markdown sidecar (scores, core fields, per-page transcripts) and thumbnails. Self-contained — usable without the raw record.
- Extraction of final data happens **only** from approved documents, never from raw uploads.
- Retention: raw `files/` are audit-only and can be swept independently of `approved/`; a 2-year retention sweep governs application data.
