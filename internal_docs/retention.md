# Data retention & access controls

Owner-set Jul 26 2026. This closes the `_future.md` gate item "Retention +
access controls — required before real (non-synthetic) borrower packets."

## Retention policy

- **Window: 2 years (730 days) after last activity.** Last activity = the
  newest ledger event on the application (fallback: the row's `updatedAt`).
  Override via `RETENTION_DAYS` env var; the default is the policy.
- **Purge is total.** When the window lapses, the application is deleted
  end-to-end: every object under `applications/<storageFolder>/` (source
  uploads, approved pdf+md pairs, run artifacts/projections), then all DB
  rows (ledger events, analysis runs, approved-docs registry, the
  application record) in one transaction. Bytes first — a crash mid-purge
  leaves a row the next sweep re-purges, never orphaned bytes.
- **Schedule:** daily sweep + one pass ~60 s after every server boot
  (`features/retention/sweep.ts`, wired in `index.ts`). Purges are logged
  (pino), not ledgered — the ledger is part of what's purged.
- **Visibility:** `GET /api/retention` returns the policy and the
  applications the next sweep will purge.
- The analyzer's local workspace (`services/analyzer/store/`) is ephemeral
  scratch, re-fetched per run — no coordinated purge needed.

## Access controls (access matrix)

Application-wide role matrix (revived from the original workflow-builder
design), enforced centrally on every `/api` request
(`features/access/middleware.ts`) and displayed read-only in the case header
(shield icon). Identity = the signed-in demo profile via `x-profile`; real
auth later replaces WHO, not WHAT.

| Role        | view | upload | edit |
|-------------|------|--------|------|
| Applicant*  | ✓    | ✓      |      |
| Originator  | ✓    | ✓      | ✓    |
| Underwriter | ✓    | ✓      | ✓    |
| Manager     | ✓    | ✓*     | ✓    |

*Applicant is declared for the future borrower upload portal — no Applicant
login exists yet. Manager upload is a deliberate deviation from the original
mockup (which had Manager view+edit only): managers run the desk today
(Marcus), so upload stays granted until a borrower/originator intake flow
exists to do the uploading.

Request → right mapping: `GET/HEAD` = view; intake-uploads + source-file
upload routes = upload; agent chat = view (the agent's write tools re-enter
the API under the caller's identity and are checked per call); every other
mutation = edit. Exempt: `/health`, `POST /login`, `GET /users` (login page),
and the analyzer worker's loopback callbacks (analysis ingest, run-failed).

v1 scope decisions: the matrix is code-defined (`features/access/matrix.ts`),
one matrix for the whole application — per-section matrices are the design's
eventual ambition, not built until needed. 401 = unknown/missing profile,
403 = right not granted.

## What real borrower data still needs (honest residue)

- Real authentication (passwords are plaintext demo creds; `x-profile` is
  client-asserted). The matrix decides WHAT; auth must eventually prove WHO.
- An agreement/notice surface for borrowers (the 2-year policy is currently
  an internal rule, not a communicated one).
