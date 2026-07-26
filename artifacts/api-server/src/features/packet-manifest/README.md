# packet-manifest

Multi-file intake v1 (Phase 5) — "the packet is not one PDF".

Flow: drop N PDFs → reviewable manifest → per-file X (reversible) → assemble.

- `POST /applications/:id/packet/files` — up to 25 PDFs, whole-drop validation
  (one bad file rejects the drop). Per file: name, size, page count, and the
  same deterministic quality flags pre-flight uses (`quickFileFlags` — raster
  blank/contrast/duplicate + embedded-image DPI, no model calls). Replaces any
  previous manifest and its staged bytes.
- `POST /applications/:id/packet/files/:fileId` `{removed}` — the X. Refused
  once assembled.
- `POST /applications/:id/packet/assemble` — concatenates kept files in
  manifest order (pdfunite) into ONE packet PDF and pushes it through the
  UNCHANGED single-packet path (`acceptPacketPdf`, shared with uploadPacket:
  pre-flight → gated → gate → analyzer). Global page addressing downstream;
  `packet.files[]` records each source file's global page span for provenance.
  Marks the manifest `assembledAt` and deletes staging.

Deliberately NOT in v1 (user ruling, see internal_docs/_future/multi-file-intake.md):
defer/re-queue lane for removed files, Google Drive ingestion, per-(file,page)
addressing. Removed = gone; re-upload later.

Staging bytes live on local disk under `DATA_DIR/packet-staging/<appId>/` —
short-lived working state; a lost staging dir fails assemble loudly
("staged bytes missing — re-drop"). Only the assembled packet is durable
(App Storage), same as before.
