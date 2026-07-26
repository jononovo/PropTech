# Technical plan — 3C completion → 3D → 4 → 5 (Jul 26, 2026)

Autonomous execution plan (user unavailable; open questions resolved below with rationale).
Guard-rails from the master plan stand: additive contract only, feature folders per concern,
data-shaped rules, loud failures, no new storage abstractions.

## Resolved questions (decided, not deferred)

1. **Merge resolutions persist on the application.** Session-only state loses the audit trail on
   refresh and the gate is a compliance rule, so it must survive. Storage: `Application.mergeResolutions`
   map keyed by `"<runId>:p<f>-<l>|p<f>-<l>"` (ranges sorted by first page) — latest decision wins
   (reversible by design; the map, not an append log, because "changed my mind" is the normal path).
2. **An accepted non-adjacent merge files as ONE approval covering multiple ranges.**
   `DocumentApproval.pageRanges?: [first,last][]` (additive; `pages` stays as the envelope for old
   readers). Materialization extracts the union of ranges into one PDF. This avoids the incoherent
   alternative (two registry rows for one logical document).
3. **Min card width** in the filmstrip: 96px so one-page cards keep readable titles.

## 3C completion (this session)
- Contract: `MergeResolution` schema + `Application.mergeResolutions` + `POST /applications/{id}/merge-resolutions`
  (operationId `recordMergeResolution`, upsert). `pageRanges` on `DocumentApproval(-Input)`.
- Server: new folder `features/merge-resolutions/` (router + key builder + validation: known run,
  ranges are real run-document/group ranges is NOT enforced — human override is allowed; only shape-validated).
  `approved-docs`: `extractPages` → multi-range; `materializeDocumentApproval` honors `pageRanges`.
- Client (`features/case-file/review/approval/`): `useDocApproval` reads/writes resolutions via API;
  `buildDocGroups` merges a resolved non-adjacent pair into one group (`pageList` = both ranges,
  `ranges` kept for submit + settled matching).

## 3D — approved-registry surface (read-only)
- Client only: `features/case-file/approved/` — `ApprovedDocsPanel` (list live rows: basename, block,
  variant label, incomplete badge, superseded history collapsed; pdf/md download via existing
  `/approved-docs/:id/file`). Surfaced as a tab/strip in the case file. Docs: `approved/README.md`.

## Phase 4 — satisfaction pass
- Analyzer worker: after filing, for each SET block with ≥1 assigned document, one text-LLM call over
  STRUCTURED inputs only (block rules + analysisNote + per-doc coreFields/scores/flags/pages + declared
  variants). Output `satisfaction/block-<id>.json` in the run store + additive run-payload field
  `satisfaction: { [blockId]: { groups: [{variantId?|descriptorGuess, docRefs, coverage}], gaps: [..], summary } }`.
- Ingest: additive schema on the run payload; no DB change (rides analysis_runs jsonb).
- Client: satisfaction card on the set block in the case file (groups, gaps, summary) — assistive,
  never a gate; humans re-assign freely.
- Model: existing text-model plan slot (worker registry is truth); cost inside the existing run gate.

## Phase 5 — multi-file intake (manifest v1) — SHIPPED & e2e-verified Jul 26 2026
Built as sketched: `POST /packet/files` (≤25 PDFs → manifest w/ per-file quickFileFlags),
per-file removed toggle, `POST /packet/assemble` (pdfunite kept files → shared
`acceptPacketPdf` path, `packet.files[]` provenance spans, manifest `assembledAt`).
Server feature: `artifacts/api-server/src/features/packet-manifest/` (README there).
Client: multi-file Dropzone + ManifestCard in PacketPanel. Staging on local disk
(`DATA_DIR/packet-staging/<appId>/`) — lost bytes fail assemble loudly ("re-drop").
- Per `multi-file-intake.md`: multi-file drop → manifest (name, size, pages, per-file pre-flight
  score) with per-file X-remove; on confirm, files are CONCATENATED into the single packet PDF the
  rest of the pipeline already understands (analyzer unchanged, page addressing stays global).
  Additive contract: `packet.files?: [{name, size, pages, score}]` for provenance display.
- Explicitly out (user ruling): defer queue, Drive ingestion, per-file page addressing.

## Sequencing
3C completion → 3D → 4 → 5. Each lands with typecheck + e2e verification and a README in its folder.
