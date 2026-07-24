# Intake — applicant form + per-block uploads

The applicant-facing side: a guided, section-by-section form rendered from the application's pinned template. Own chrome (no staff shell) — contributors get one-thing-at-a-time, never tables.

## How it works

- Staff copy the intake link from the case file ("Request from applicant" = copy link until email infra arrives in v3).
- The form renders sections/blocks from the pinned template copy; field blocks collect values, document blocks collect files.
- Uploads: `POST /applications/{id}/uploads/{blockId}` (multipart, 50MB cap), `DELETE /applications/{id}/uploads/{blockId}/{filename}`.
- Server validates block existence, block kind, allowed formats (extension check **before** any write), and filesystem-safe id segments; filenames are sanitized from the original name.
- Bytes go to **App Storage first, record second** — an orphaned object is harmless, a dangling record is not. Deletes remove the record and best-effort delete the object.

## Where

- Server: `features/intake-uploads/` (files), `features/intake/` (form data).
- Client: `features/intake/`.
- Bytes: App Storage `uploads/<appId>/<blockId>/<file>` — see `persistence.md`.
