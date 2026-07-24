# Homium Portal — Build Specification
Status: approved for build · Companion: `homium-template-schema-spec.md` (the JSON contract)
Decisions locked Jul 23, 2026: scope = builder + library + applicant intake · persistence = JSON files on disk · auth = none in v1 (open portal, roles simulated by a switcher)

---

## 1. What is being built

A React + Vite web portal (internal tool, no SEO/SSR) with an Express API, in the
existing pnpm monorepo as a new artifact. Three surfaces, all already designed and
approved on the canvas (FormBuilderA, FormLibrary, and the builder's applicant
preview are the visual source of truth — Ops Desk aesthetic throughout):

1. **Form Library** — template families, versions, draft/active statuses, row menu (edit / preview / update to a new version / duplicate / export JSON / activate).
2. **Form Builder** — palette drag, sections/subsections/blocks, saved sections (copies, never links), collapse/reorder, per-section permissions, document dimensions (requirement / criticality / sourcing), alternative groups, live preview pane (mobile / desktop / register, previewing-as role), JSON drawer.
3. **Applicant Intake** — fill + upload against an **active** template version: section stepper, document cards with `DocDimensions` icons + tooltips, field groups, alternative-group satisfaction ("any one of"), expiry copy from the clocks.

Out of scope v1 (explicitly): analyzer, review room, auth/logins, database,
conditional logic beyond alternative groups, retire/archive flows, negative
document weighting.

## 2. Persistence — files are the database

```
data/
  templates/
    purchase-loan-ca/        ← family slug
      v3.json                ← one template version = one file (the whole contract)
      v4.json
    refinance-ca/
      v2.json
  applications/
    <application-id>.json    ← pins { family, version } at creation, plus per-block intake state
  uploads/
    <application-id>/<block-id>/<filename>
```

Rules (enforced by the backend, single source: `features/templates/template-store`):
- A template file's `status` lives inside the JSON. **Drafts are writable; active files are immutable** — any write to an active version is rejected (409).
- "Update to a new version": copy `vN.json` → `v(N+1).json` with `status: "draft"`, bump `version`. vN untouched.
- "Activate": rewrite status draft → active. One-way in v1.
- The library index is **derived by scanning the directory** — no index file to drift.
- `inUseBy` = count of application files pinning that family+version.
- Applications may only be created against **active** versions.
- All writes are atomic (write temp file, rename).

## 3. Monorepo shape — mirrored features

New artifact `portal` (two packages) + one shared contract package:

```
shared/homium-contract/           ← THE JSON contract: types + pure logic, zero UI, zero IO
  src/
    template.ts                   ← Template/Section/Subsection/Block/Field types
    dimensions.ts                 ← RequirementLevel, Criticality, Sourcing + label fns
    alternatives.ts               ← AlternativeGroup + groupForPrimary/groupsSatisfiedBy/blockName
    permissions.ts                ← Role, Permission
    expiry.ts                     ← ExpiryRule + expiryLabel
    lifecycle.ts                  ← TemplateStatus + transition rules (draft→active, vN→vN+1)
    validate.ts                   ← invariants from schema-spec §3 (validated on every save/import)
    stats.ts                      ← templateStats, satisfaction logic for alternative groups

artifacts/portal-api/             ← Express, binds $PORT… (backend)
  src/
    features/
      template-library/           ← routes + service: list (scan), duplicate, new-version, activate, export
      template-editor/            ← routes + service: read one, save draft (validate → atomic write)
      saved-sections/             ← routes + service: section fragment library (copies on insert)
      intake/                     ← routes + service: create application (pin version), read, save field values
      intake-uploads/             ← routes + service: multipart upload to data/uploads, list/delete per block
    lib/                          ← tiny cross-cutting only: fs-atomic, http-errors, id
    app.ts / index.ts             ← compose feature routers; no logic here

artifacts/portal/                 ← React + Vite (frontend)
  src/
    features/
      template-library/           ← library page: family groups, version rows, status tags, row menu
      template-editor/            ← builder page: palette, canvas, section/block editing, drag/reorder
      saved-sections/             ← palette group + save-as-block flow
      template-preview/           ← preview pane: mobile/desktop/register, previewing-as
      intake/                     ← applicant flow: stepper, section pages, field groups
      intake-uploads/             ← document cards, file picker, filed state
      dimensions/                 ← DocDimensions (icons/labels/tooltip) — used by editor, preview, intake
    ui/                           ← Ops Desk primitives only: Tag, Menu, Select, Switch, MonoMeta, Drawer
    lib/                          ← api client (typed, per-feature endpoints), query hooks
    app/                          ← router + shell (header, nav); no business logic
```

**Mirroring rule:** every backend feature folder has the same name as the frontend
feature it serves (`template-library`, `template-editor`, `saved-sections`,
`intake`, `intake-uploads`). Frontend-only features (`template-preview`,
`dimensions`) have no backend twin because they are pure renderings of the
contract — that asymmetry is allowed and documented here.

**Modularity rules (hard):**
- No file over ~250 lines; split by responsibility, not by line count alone.
- A feature imports from `shared/homium-contract`, its own folder, and `ui`/`lib` — **never from another feature**. Cross-feature needs go through the contract or get promoted to `ui`/`lib`.
- Routes files contain HTTP wiring only; logic lives in the feature's `service.ts`; file IO only in `template-store` / `application-store`.
- Names are specific: `template-version-row.tsx`, `block-dimensions-selects.tsx`, `alternative-group-caption.tsx` — never `helpers.ts`, `utils.ts`, `misc.ts`.

## 4. API surface (v1)

```
GET    /api/templates                              → library index (derived scan)
POST   /api/templates                              → new family draft (from blank or duplicate source)
GET    /api/templates/:family/:version             → full template JSON
PUT    /api/templates/:family/:version             → save draft (400 invalid, 409 if active)
POST   /api/templates/:family/:version/new-version → vN → v(N+1) draft
POST   /api/templates/:family/:version/duplicate   → new family draft copy
POST   /api/templates/:family/:version/activate    → draft → active
GET    /api/templates/:family/:version/export      → download JSON

GET    /api/saved-sections                         → fragment list
POST   /api/saved-sections                         → save a section as fragment

POST   /api/applications                           → create (pins family+version; active only)
GET    /api/applications/:id                       → application + intake state
PUT    /api/applications/:id/fields/:blockId       → save field-group values
POST   /api/applications/:id/uploads/:blockId      → upload file(s)
DELETE /api/applications/:id/uploads/:blockId/:file
```

All request/response bodies typed from `shared/homium-contract`; the API returns
contract-shaped JSON, never bespoke DTOs.

## 5. Frontend routes

```
/                     → Form Library
/templates/:family/:version/edit      → Builder (drafts; active opens read-only with banner-less quiet lock state)
/templates/:family/:version/preview   → full-page preview (same component as the pane)
/apply/:family/:version               → start application → redirect to /applications/:id
/applications/:id                     → intake stepper (sections visible to Applicant role only)
```

Role simulation (auth deferred): a quiet header switcher (Applicant / Originator /
Underwriter / Manager) drives permission-filtered rendering everywhere the mocks
show "Previewing as". It sets a header `x-role`; the backend does not enforce it
in v1 — enforcement arrives with auth, behind the same seam.

## 6. Design source of truth

Port, do not reinvent: `mockup-sandbox/src/components/mockups/homium/`
(FormBuilderA, FormLibrary, DocDimensions, builderData). The mockups' `builderData.ts`
becomes seed content: `PURCHASE_LOAN` → `data/templates/purchase-loan-ca/v3.json`
(status active, so intake works day one) and a v4 draft copy; `SAVED_SECTIONS`
become real fragments; `TEMPLATE_INDEX` is discarded (index is derived).
Exception-based dimension display, copies-not-links, two-clock language, and
draft/active doctrine all carry over exactly as specced.

## 7. Build order

1. `shared/homium-contract` (types, validation, tests for invariants + satisfaction logic).
2. `portal-api`: template-store + template-library + template-editor features, seeded data.
3. `portal`: shell + library + builder (port A's interaction model onto real API).
4. Intake feature pair (create/pin, fields, uploads) + DocDimensions port.
5. Wire preview pane to live template state; export; saved sections.
6. Validation pass: draft/active immutability, alternative-group satisfaction, version pinning.
