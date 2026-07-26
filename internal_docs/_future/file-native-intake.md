# File-Native Document Model — technical spec (v1 draft, Jul 26 2026)

Ruling that triggered this (user, Jul 26): **files stay in the form they were
dropped.** No concatenation, ever. Splits/merges materialize as NEW derived
files with lineage back to their immutable originals. Uploads and packets are
one unified concept. One append-only event ledger covers everything.

This retires the "packet = one PDF with global page numbers" model that every
layer currently assumes. It is the largest structural change since Phase 3,
and it is mostly a SIMPLIFICATION: the diff below deletes more concepts than
it adds.

---

## 1. The model

### 1.1 One entity: `SourceFile`

Every PDF that enters the system — dropped unsolicited OR uploaded against a
block/variant — becomes a `SourceFile`:

```
SourceFile {
  id            "sf-<nanoid8>"           minted at intake, never reused
  kind          "original" | "derived"
  origin        "unsolicited" | "solicited"   (solicited = uploaded against a block/variant)
  filename      current assigned name (rename = metadata, bytes untouched)
  originalFilename  as received (originals only)
  blockId?, variantId?                   solicited intent, if any
  sizeBytes, pages, sha256
  flags         string[]                 per-file deterministic pre-flight flags
  status        "active" | "archived"    (archived = out of the working view, never deleted)
  receivedAt, receivedBy, receivedIp     (derived files: createdAt/createdBy + derivation)
  derivation?   { op: "split"|"merge", sources: [{fileId, pages:[f,l]}...] }   (derived only)
}
```

- Stored on the application doc as `app.files: SourceFile[]` (append-only in
  spirit: rows are never removed; `status` and `filename` are the only mutable
  fields, via `updateApplication` tx as always).
- Bytes at `applications/<appId>/files/<fileId>.pdf` — ONE canonical key
  scheme, immutable content, id-addressed so renames never touch storage.
- **Rename ≠ copy.** A rename writes a ledger event + updates `filename`.
- **Derived files are the ONLY duplication**, created at split/merge (which in
  practice happens at approval time — approval-only extraction ruling stands).
  The approved store (`applications/<appId>/approved/`) already IS our derived
  store; a derived `SourceFile` row gives it lineage and a place in the file
  list. Originals are never edited in place (audit ruling).

### 1.2 Page addressing: `(fileId, page)`

Global packet page numbers die. Everywhere a page is referenced it becomes a
file-qualified address. Canonical wire shape:

```
PageRef  { fileId, page }                      1-based within the file
FileSpan { fileId, pages: [first, last] }      contiguous within ONE file
```

- Analyzer segments: `segment.spans: FileSpan[]` (a document may span files —
  merge recommendation — but a single span never crosses a file boundary).
- Approvals: `pageRanges` becomes `FileSpan[]` (today's multi-range approval
  generalizes cleanly — it already carries a list of ranges).
- Merge-resolution keys: `<runId>:<fileId>:p<f>-<l>|<fileId>:p<f>-<l>`
  (same lockstep rule between server `mergeKey.ts` and client `docGroups.ts`).
- Render/thumbnail URLs gain a file segment:
  `/runs/:runId/files/:fileId/pages/:page` and thumbnails
  `applications/<appId>/files/<fileId>/thumbs/page-<n>.png`.

### 1.3 One run analyzes a SET of files

`AnalysisRun.input: [{fileId, sha256, pages}]` replaces `packetSha256`.
A run is kicked against the current set of active, gate-confirmed files.
The gate stays — but it gates a **file set**, not a blob: the gate card lists
the files with their flags, and one plan/decision covers the run.

### 1.4 The ledger: `application_events`

New Postgres table (append-only, never updated):

```
application_events (
  seq            bigserial PK
  application_id text     indexed
  at             timestamptz
  actor          jsonb    { name?, role?, ip? }        -- system events: { system: "analyzer" }
  action         text     one of the enum below
  target         jsonb    { fileIds?, runId?, blockId?, approvedDocId?, ... }
  detail         jsonb    action-specific payload (sizes, from/to names, decision, reason)
)
```

Actions v1: `file_received`, `file_renamed`, `file_archived`, `file_restored`,
`file_derived` (split/merge), `gate_decided`, `run_started`, `run_landed`,
`run_failed`, `doc_approved`, `doc_rejected`, `doc_superseded`,
`merge_resolved`, `template_repinned`, `materialization_failed`,
`variant_added`.

**Write rule:** the ledger is written in the SAME transaction as the state
change it records (one `withTx` covering `updateApplication` + event insert)
— an audit line must never exist without its state change or vice versa.

**Subsumption policy (avoids dead weight without a risky migration):**
- Events are the *read surface* for history. The existing operational
  structures that the state machine itself depends on — `documentApprovals`
  trail, `mergeResolutions`, `approved_documents` registry, `analysis_runs` —
  STAY as working state; they additionally emit events.
- `templateHistory` and `materializationErrors` history are fully subsumed:
  new writes go only to the ledger; the fields are dropped from the contract
  once the ledger ships (they have no machine consumers — UI-only).
- Scattered `uploaderIp`/`uploadedAt` copies become redundant with
  `file_received` events but stay on `SourceFile` (cheap, useful for display
  without a ledger query).

### 1.5 Ledger UI

- `GET /applications/:id/events?actions=&actor=&from=&to=` (paged, newest
  first). Deliberately boring UI: monospace rows, filter toggles across the
  top (submissions / edits / approvals / runs / per-person), row-end icons →
  open in review strip / open the file. Reachable via a small log icon on the
  case file. Not a designed page — a ledger.
- Per-file history = same endpoint filtered by fileId (drives a hover card /
  side sheet on any file chip: received by/at/IP, renames, derivations,
  approvals).
- File chips in intake/review get a small "who · when" line; hover reveals
  the full detail. This + status filter (`active`/`archived`) replaces
  batches entirely — "Jessica's 20 from yesterday" is a filter, and stale
  pending files get archived out of the strip, not deleted.

### 1.6 Solicited uploads join the flow

An upload against a block/variant is a `SourceFile` with `origin: "solicited"`
and declared intent. It goes through the same analysis + filmstrip approval
flow; the review UI shows a caveat banner: *"submitted for <block>/<variant> —
analyzer agrees"* (suggestedBlockId matches declared) or *"analyzer disagrees:
looks like <X>"*. Agreement = strong prior, one-click approve; disagreement =
normal review. This deletes the current world where uploads silently bypass
analysis and approval.

---

## 2. What gets DELETED (the payoff)

| Delete | Why dead |
|---|---|
| `POST /packet/assemble`, `pdfunite`, `acceptPacketPdf`'s concat path | no concatenation, ever |
| `packetManifest` + staging dir + `packet-manifest/staging.ts` | the manifest IS `app.files` now — files land durably at drop, reviewable in place; no second staging copy, no "staged bytes missing" failure mode |
| `packet.files[]` provenance spans | provenance is inherent — files never lost their identity |
| `Application.packet` as a blob record (filename/sizeBytes/sha256 of THE pdf) | replaced by `app.files` + a slim `run gate` state |
| `applications/<appId>/packet/packet.pdf` key + `putPacketPdf` | bytes live per-file |
| `applications/<appId>/uploads/<blockId>/<filename>` key scheme | unified under `files/<fileId>.pdf`; blockId is metadata, not a path |
| `UploadedFile` schema + `intake-uploads` bespoke storage | uploads are `SourceFile`s; the route stays but thins to "receive file with intent" |
| duplicate multer configs / filename sanitizers (3 copies today) | one shared `receiveFiles` helper in a single intake feature |
| `templateHistory`, `materializationErrors` map (contract fields) | subsumed by ledger |
| global-page regex plumbing (`p.6 appears blank` parsed by int) worker-side | flags become structured `{fileId, page, code}` — deletes fragile regex in `runner.py`/`split_classify.py` |

Net: the packet/upload split, the manifest, the assemble step, one storage
key scheme, and two contract fields disappear. The state machine shrinks from
"packet lifecycle" to "run lifecycle" (`gated → processing → report` per run
request), which is what it really was.

## 3. What CHANGES (per layer)

### Contract (`lib/api-spec/openapi.yaml`)
- New: `SourceFile`, `PageRef`, `FileSpan`, `ApplicationEvent` schemas;
  `app.files`; `GET /applications/:id/events`; file routes
  (`POST /applications/:id/files` multi-upload w/ optional block/variant
  intent, `PATCH .../files/:fileId` rename/archive, `GET .../files/:fileId`).
- Changed: `AnalysisDocument.segment` → `spans: FileSpan[]`;
  `DocumentApproval.pageRanges` → `FileSpan[]`; run request/ingest carry the
  file set; render URLs file-qualified; `unassigned[]` file-qualified.
- Removed: packet/packetManifest schemas & routes (above).
- **No back-compat shims**: existing demo apps are fixtures; migrate the two
  worth keeping with a one-off script (wrap current packet as one SourceFile,
  rewrite spans as `{fileId: <that file>, pages}`), delete the rest.

### Server (`artifacts/api-server`)
- New feature `files/` (receive, rename, archive, serve, per-file preflight →
  flags + thumbnails on receipt — deterministic, at drop time, so review is
  instant and the gate card is free).
- New feature `events/` (ledger write helper `recordEvent(tx, ...)` + query
  route). Every mutating feature calls it inside its existing tx.
- `packet/` feature becomes `runs-gate/`: request-run (choose files → gate),
  decide-gate, kickAnalyzer with file set, run-failed. Preflight code moves to
  `files/`; `quickFileFlags` is already the right shape.
- `approved-docs/materialize.ts`: extract from per-file sources (union of
  FileSpans, possibly across files for merged docs) — same pdftk/qpdf slice,
  input path per span. Registers the output as a derived `SourceFile`.

### Worker (`services/analyzer`)
- `RunRequest` carries `[{fileId, sha256}]`; fetch N files; render per file
  (`store/<app>/<run>/<fileId>/pages/p-N.png`, md same).
- Internal pipeline can keep a run-local linear ordering for the LLM passes
  (file order = received order) but ALL emitted addresses are `(fileId, page)`
  — the linearization is an implementation detail that never leaks.
- Boundary logic: spans never cross files; same-blockId docs in different
  files → merge recommendation (existing mechanism, now naturally cross-file).
- Structured flags replace parsed strings.

### Client (`artifacts/client`)
- `PacketPanel` → `FilesPanel`: drop N files → they simply appear in the file
  list (flags, who/when, archive toggle) — the ManifestCard interaction
  survives almost unchanged, minus "Build packet"; instead: select files →
  "Run analysis" → gate card.
- `reviewModel.pageImageUrl(appId, runId, fileId, page)`; filmstrip groups by
  document exactly as today — cards already carry `ranges`, they become
  `FileSpan[]`. Strip gains subtle file separators + per-file header chip
  (who/when on hover).
- `docGroups.ts`: key/equality logic generalizes from `[f,l]` to
  `{fileId,[f,l]}` — mechanical.
- Ledger page + file hover cards (new, small).
- Register/ApprovedDocsPanel: unchanged except lineage line ("derived from
  <file> pp. a–b").

## 4. Sequencing (each step ships alone, high → low value/risk ratio)

1. **Ledger** (table, `recordEvent`, emit from all existing mutations, boring
   UI page). Zero schema breakage, immediate value, and every later step
   then audits itself from day one.
2. **SourceFile registry + unified receive** — SHIPPED Jul 26. `app.files`
   registry; `receiveSourceFiles()` is the ONE receive seam (features/files);
   all three entry points (unsolicited drop `POST /files`, solicited block
   upload, manifest drop, plus single packet upload) route through it. Bytes
   immutable + id-addressed at `applications/<appId>/files/<fileId><ext>`;
   per-file flags/sha/pages at drop; rename = metadata + ledger event
   (`PATCH /files/:fileId`); bytes served at `GET /files/:fileId`. Local
   packet staging DELETED — assemble reads durable registry bytes (legacy
   pf- manifests must re-drop). Upload delete archives the registry row
   (status field only, no UI — archive deferred). Packet concatenation
   itself still stands until phase 3.
3. **File-native runs** (contract + worker + kick/gate on file sets; delete
   concatenation, manifest, packet blob). The big one.
4. **Review room on FileSpans** + solicited-upload approval flow w/ caveat
   banner.
5. **Cleanup**: drop dead schemas/routes/keys, migrate/delete fixtures,
   docs.

## 4.1 Markdown intelligence corpus (SHIPPED Jul 26, ahead of phase 3)

Every analyzer run now writes ONE frontmattered `.md` per suggested document
into App Storage (`applications/<appId>/runs/<runId>/doc-NN_<slug>.md`):
scores, flags, coreFields, confidence, provenance in YAML front matter; the
full per-page transcript as the body (`analysis/runSidecars.ts`). This mirrors
the approved-doc sidecar pattern, just earlier in the lifecycle.

Rules:
- These files are **projections** — derived, regenerable, never the source of
  truth. Postgres (`analysis_runs`, `approved_documents`, `application_events`)
  stays the authority for anything the app behaves on.
- Write failure is loud (ledger `run.sidecars_failed`) but never fails ingest.
- Phase 3 switches their page addressing from packet-global to
  `(fileId, page)`; no migration needed — regenerate.
- Together with the approved `.pdf`+`.md` pairs and a ledger export, one
  application folder in App Storage IS the whole intelligence corpus:
  greppable, portable markdown, ready for agents/RAG with zero schema work.

## 4.2 Agent / intelligence layer (post-phase-5, own plan)

Per-application Q&A agent over the corpus: tools = list files / read file /
query ledger; context docs (company ethos, platform purpose, template
explainer) added as plain MDs in the corpus. No vector DB at this scale —
an application's corpus fits direct search + LLM tool use. Vector/RAG stores
(e.g. zvec-style) only become relevant cross-application/archive; nothing in
the corpus format blocks any of them. Agent-taken actions, if ever, go
through the same API routes and therefore the same ledger.

## 5. Open questions for the user

(asked in chat; recorded here with the answers when they land)

1. Multi-file documents: may ONE approved document span pages from TWO
   different source files (e.g. statement p1 in fileA, p2 in fileB)? Spec
   assumes YES via merge → FileSpan[]. If NO, several things simplify.
2. Gate granularity: one gate per RUN over the whole selected file set
   (assumed), or per-file gates? Per-run matches today's model-plan-per-run.
3. Ledger scope: per-application only (assumed), or also a global cross-app
   feed for managers later? Table design supports both; only the route/UI
   differs.
4. Archived files: excluded from new runs (assumed) — restore first to
   include?
5. Retention of superseded/derived files: keep forever (assumed — audit).
