# Ledger

Append-only per-application event history (`application_events` table) — the
audit trail behind the Ledger lens and per-file history.

## Invariants
- Events are written in the SAME transaction as the state change they record.
  Mutations through `updateApplication` use its `emit` hook (second mutate arg);
  inserts outside it (application create, run ingest) call `appendEvent`.
- Rows are never updated or deleted.
- `actor` = `{kind: "user"|"system", name?, ip?}`. `target` = `{type, id?, label?}`.
- Action names are `noun.verb` strings ("file.uploaded", "gate.confirmed",
  "verdict.accepted", "merge.merged", "run.ingested", …). Add new ones freely —
  the ledger UI renders unknown actions as-is.

## API
`GET /applications/:id/events` — newest first. Filtering (actor/action/date)
is client-side for now; per-app volumes are small.
