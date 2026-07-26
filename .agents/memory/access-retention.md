---
name: Access matrix & data retention
description: Server-enforced role matrix + 2-year retention sweep (the "real borrower data" gate), rulings and gotchas
---

# Access matrix & retention (shipped Jul 26 2026)

Policy doc: `internal_docs/retention.md`. Server code: `features/access/` (matrix, middleware, router), `features/retention/` (sweep, router).

## Rules
- Every /api request passes the access-matrix middleware: identity = `x-profile` header (demo profiles; real auth later replaces WHO, not WHAT). GET=view, upload routes=upload, agent chat=view, other mutations=edit. 401 unknown profile, 403 missing right.
- **Curl/scripts and the qa-agent portal MUST send `x-profile`** or they get 401 — any new server-side self-call or worker callback must either forward it or be added to the middleware exemptions (`/healthz`, POST /login, GET /users, analyzer callbacks: POST .../analysis, .../run/failed).
- Client sends the header via `setDefaultHeadersGetter` in api-client-react (registered in ProfileContext, reads localStorage per request). Raw fetches (citations, chat transport, matrix popover) use `profileHeaders()` from ProfileContext.
- **Why Manager has upload** (deviation from the revived mockup): Marcus — the primary operator — is role Manager; blocking upload would break the daily flow. Revisit when a borrower/originator intake flow does the uploading.
- Applicant role is declared in the matrix but has no login — reserved for a borrower upload portal.
- Retention: 730 days (env `RETENTION_DAYS`) after last ledger event; daily sweep + boot+60s; purge = object folder first, then all DB rows in one tx. `GET /api/retention` previews. Purges are logged, not ledgered.

## Gotchas
- users.role truth: marcus=Manager, dana/priya=Underwriter, ron=Originator (memory previously said Marcus was Underwriter — wrong).
- Public sample packets for testing live in `test-assets/public-samples/` (URLA filled example, 3 bank statements, 2 W-2s, 2 pay stubs) with SOURCES.md.
