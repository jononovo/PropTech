---
name: Access matrix & data retention
description: Server-enforced role matrix + 2-year retention sweep (the "real borrower data" gate), rulings and gotchas
---

# Access matrix & retention (shipped Jul 26 2026)

Policy doc: `internal_docs/retention.md`. Server code: `features/access/` (matrix, middleware, router), `features/retention/` (sweep, router).

## Rules
- Every /api request passes the access-matrix middleware: identity = signed session cookie `sheaf_session` (HMAC of username w/ SESSION_SECRET, set at POST /login) first, `x-profile` header as curl/testing fallback. GET=view, upload routes=upload, agent chat=view, other mutations=edit. 401 unknown profile, 403 missing right. Cookie exists because `<img>` requests can't carry custom headers (Jul 26 thumbnail-401 incident); see internal_docs/auth.md.
- **Curl/scripts and the qa-agent portal MUST send `x-profile`** or they get 401 — any new server-side self-call or worker callback must either forward it or send the service header `x-sheaf-service: analyzer-worker` (the worker's httpx client sends it on every call). The service identity is SCOPED — it only reaches `/applications/*` paths, everything else 403s; don't widen it, widen the scope regex deliberately if the worker ever needs more. Path exemptions: /healthz, POST /login, POST /logout, GET /users. Lesson (Jul 26 401 incident): path-list exemptions for the worker broke as soon as it made a call not on the list — exempt by service identity, not path.
- Client has NO header plumbing anymore — the browser attaches the cookie to everything (fetch, img, downloads). localStorage `sheaf.profile` is UI-only display state with zero server authority. qa-agent portal forwards the incoming `cookie` header.
- **Why Manager has upload** (deviation from the revived mockup): Marcus — the primary operator — is role Manager; blocking upload would break the daily flow. Revisit when a borrower/originator intake flow does the uploading.
- Applicant role is declared in the matrix but has no login — reserved for a borrower upload portal.
- Retention: 730 days (env `RETENTION_DAYS`) after last ledger event; daily sweep + boot+60s; purge = object folder first, then all DB rows in one tx. `GET /api/retention` previews. Purges are logged, not ledgered.

## Gotchas
- users.role truth: marcus=Manager, dana/priya=Underwriter, ron=Originator (memory previously said Marcus was Underwriter — wrong).
- Public sample packets for testing live in `test-assets/public-samples/` (URLA filled example, 3 bank statements, 2 W-2s, 2 pay stubs) with SOURCES.md.

## Section-level permissions (Jul 26 2026)
- Access matrix display moved to /settings (UserMenu link); case-header AccessMatrixButton deleted. Shared `RoleAccessGrid` (client/src/components) renders every roles×rights surface — read-only (settings) or editable via optional onToggle (template-editor section panel).
- Template section "Who adds" (upload) is ENFORCED server-side on POST .../uploads/:blockId — validateUploadTarget resolves block→section (findSectionOfBlock/sectionAllowsUpload in intake/blocks.ts), 403 when the requester's role lacks upload. "Who sees" (view) is still declared-only — no filtering anywhere yet.
- Gotcha: service identity (x-sheaf-service) has no res.locals.profile role → would 403 on the uploads route; worker never calls it today. /apply runs under the signed-in ops role until a real borrower identity exists.
