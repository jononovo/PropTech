# Templates — families, versions, builder, dimensions

A template defines the document checklist for a loan program. One schema definition renders every view (builder preview, intake form, case-file checklist). Contract spec: `docs/homium-template-schema-spec.md`.

## Library & lifecycle

- Templates group by **family** with one row per **version** (e.g. `purchase-loan-ca` v3 active, v4 draft).
- **draft** = editable, not assignable. **active** = frozen (edits → 409), in use.
- "Update to a new version" copies vN → v(N+1) draft; vN **stays active** — concurrent versions by design.
- Row menu owns lifecycle actions: Edit / Preview / New version / Duplicate / Export JSON / Retire. The builder header carries only the version token + status tag.
- Applications **pin a full template copy** at creation, forever (see `applications.md` for repin).
- API: `GET/POST /templates`, `GET/PUT /templates/{family}/{version}`, `/new-version`, `/duplicate`, `/activate`.

## Builder (template editor)

- Single column: sections → blocks. Block kinds: **document** and **fields** only. Palette drag to insert; sections collapse and reorder.
- **Saved sections**: reusable section snippets in the palette; inserting one creates a **copy, never a link** (v1 doctrine). `GET/POST /saved-sections`.
- Document blocks carry optional `docType` (classification target for the analyzer) and the dimensions below.

## Document dimensions (per document block)

- **Requirement** is a RULE: `required | required_alt | recommended | optional`.
- **Criticality** is a WEIGHT: `critical | standard | supporting` — drives analyzer scrutiny tier and review-queue order.
- **Sourcing** is an INTELLIGENCE TAG: `readily_available | constrained | scarce` — analysis-only, **never applicant-facing help text**.
- **Alternatives belong to the requirement, not the document**: `alternatives[] {primary, satisfiedBy[]}`, any-one-of, may cross sections. Captions derive both directions ("required — unless Passport is filed").
- Overlap rule: critical+scarce, or critical-satisfied-by-alternative ⇒ deep fraud scan.
- Display is **exception-based** (one shared renderer, client `features/dimensions/`): requirement always renders; criticality only when critical; sourcing only when constrained/scarce; alternatives icon only inside a group. No icon soup.

## Where

- Server: `features/template-library/`, `features/template-editor/`, `features/saved-sections/`.
- Client: same three names under `artifacts/client/src/features/`.
- Persistence: Postgres (`templates`, `saved_sections`), seeded from committed JSON fixtures — see `persistence.md`.
