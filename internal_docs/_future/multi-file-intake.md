# Multi-file intake ("the packet is not one PDF")

Status: DISCUSSION — captured Jul 25, 2026. Deliberately scoped down by the user.

## The problem
The current pipeline assumes ONE packet PDF. Reality: a drop of 10 PDFs, a folder of 50, or a
link to a Google Drive folder with subfolders. The single-packet assumption is baked into
upload → pre-flight → gate → run.

## Agreed v1 scope (keep it simple)
- Accept multiple files in one intake drop.
- Pre-processing produces a MANIFEST before any analysis: file list with name, size, page count,
  and per-file quality signal (reuse the existing deterministic pre-flight scoring per file —
  "some of them look pretty shitty").
- The manifest is reviewable: each file has an X to REMOVE it from this run (e.g. the 50 MB /
  200-page monster gets pulled; the user processes it separately later by re-uploading).
- Explicitly NOT in v1 (user: "we might be over-engineering"): a defer/re-queue lane for removed
  files, Google Drive folder ingestion, recursive subfolder handling. Removed = gone; the person
  re-uploads when ready.

## Build notes (when picked up)
- Gate card becomes a manifest card: N files, sizes, worst pages across files, per-file X.
- Run input becomes a file SET; page addressing must become (file, page) — this ripples into
  segments, artifacts paths, thumbnails, and manual placements. That ripple is the real cost;
  scope it before committing.
- Google Drive ingestion would arrive later as just another way to populate the same manifest.
