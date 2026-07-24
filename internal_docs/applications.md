# Applications — the case file data model

An application is one applicant's loan file: pinned template copy + field values + uploads + packet state + runs + verdicts + audit trail, stored as **one jsonb document per row** in Postgres.

## Lifecycle

- Created from an **active** template version; the full template is copied in and pinned forever. Concurrent template versions across applications are by design.
- `projectedClosingDate` lives top-level (drives expiry logic later).
- Field edits: `PATCH-style POST /applications/{id}/fields/{blockId}`.
- **Repin to a newer active version**: `POST /applications/{id}/template-version` — server enforces **additive-only** changes; case-file header shows a nudge when a newer active version exists; every repin lands in `templateHistory` (audit). Rollback = copy-old-into-new-draft-and-activate on the template side.

## Mutation rule (critical)

All application writes go through `updateApplication(id, mutate)` — a `SELECT ... FOR UPDATE` transaction; `mutate` may throw `HttpError(status, msg)` to abort with a mapped response. This makes packet gate/state transitions atomic across instances. **Never write an application outside it; never hold the transaction across preflight or ingest.**

## API surface

- `GET/POST /applications`, `GET /applications/{id}`
- `/fields/{blockId}`, `/template-version`, `/uploads/...` (see `intake.md`), `/packet...` (see `packet-pipeline.md`), `/analysis` + `/verdicts/{blockId}` (see `analyzer.md`, `review.md`).

## Where

- Server: `features/intake/` (application CRUD + fields), `lib/db` (`applications` table).
- Client: `features/case-file/` — the staff working view (checklist, packet rail, report, audit).

## Known gap (parked)

Closing-date and other field edits are **not attributed** (no `editedBy`) and don't appear in the audit trail — waits for real auth. See `_future.md`.
