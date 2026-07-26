# files — SourceFile registry + unified receive (file-native intake, phase 2)

Every file that enters the system — unsolicited drop OR solicited upload
against a block/variant — becomes a `SourceFile` on `app.files`:

- **Immutable, id-addressed bytes** at `applications/<appId>/files/<fileId><ext>`
  (`ext` from the immutable ORIGINAL filename). Rename = metadata + ledger
  event; bytes and key never move.
- **Append-only in spirit**: rows are never removed; `filename` and `status`
  are the only mutable fields. `status: archived` exists in the schema only —
  archive behavior/UI is deferred (user ruling).
- **Per-file preflight at drop**: pages, sha256, deterministic flags
  (`quickFileFlags`) computed when the file lands, so review is instant.
- **Whole-drop validation**: one bad file rejects the whole drop before any
  bytes or state land.

## Seams

- `receive.ts` `receiveSourceFiles()` — THE single receive path. The three
  historical multer entry points route through here:
  - `POST /applications/:id/files` (this feature — unsolicited or with intent)
  - `POST /applications/:id/uploads/:blockId` (intake-uploads, solicited)
  - `POST /applications/:id/packet/files` (packet-manifest drops — until
    phase 3 deletes concatenation, manifest entries carry `sourceFileId` and
    assemble reads durable bytes from this registry; local staging is gone)
- `PATCH /applications/:id/files/:fileId` — rename (metadata only).
- `GET /applications/:id/files/:fileId` — stream immutable bytes.

## Invariants

1. Bytes land BEFORE registry rows (orphaned object harmless; dangling row not).
2. Registry rows + their `file.received` ledger events commit in ONE transaction.
3. Never reuse a fileId; never overwrite SourceFile bytes.
4. Derived files (split/merge) get `kind: derived` + `derivation` lineage —
   creation deferred until the review-room work (phase 4+; merges stay logical).
