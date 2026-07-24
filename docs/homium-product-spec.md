# Homium Compliance Manager — Product Specification & Handoff Document

Status: living handoff doc for AI/engineering collaborators · Last updated: Jul 24, 2026
Companion docs: `docs/homium-template-schema-spec.md` (JSON contract deep-dive), `docs/homium-portal-build-spec.md` (v1 build architecture)

**How to read this:** Part A is context everyone needs. Part B is what is BUILT and running today. Part C is the rest of the product — agreed direction, designed in high-fidelity mockups, NOT yet built. Do not assume anything in Part C exists in code.

---

## Part A — Product context

**Naming (user decision, Jul 24 2026):** the product/app is **Sheaf** — the brand in the shell, no client name in it. **Homium** is the client whose program ("Homium Deposit Assistance") runs inside it and who ratifies schemas. The analyzer/pipeline source of truth is the **Homium Analyzer build spec v0.6.3 FINAL** (`internal_docs/_context/homium-analyzer-spec-v0.6.3-FINAL.md`; supersedes all prior versions including v0.6.2 and IDCM). It defers to this doc and the template schema spec where they overlap. Its accepted additive v1 portal items: optional `docType` on document blocks (+ quiet builder dropdown, seeds tagged), `POST /api/applications/{id}/analysis` single-run write-path into a portal-owned sidecar, pre-flight gate as the first C2 staged state, and a top-level `projectedClosingDate` field on applications.

### A1. What Homium is
- Fintech (homium.io) providing home-loan deposit assistance ("Homium Deposit Assistance" program).
- Core operational problem: every loan produces a 300+ page PDF file of supporting documents that compliance staff must split, identify, verify, and keep current through closing.
- The product is an internal **compliance manager**: define what documents a loan requires (templates), collect them (intake), analyze them with AI (analyzer), verify them with humans (review room), and track validity over time (expiry clocks, register, timeline).

### A2. The one central idea
- **One JSON template file is the entire contract.** The form builder outputs one JSON file per template version. Everything else — applicant form, register view, analyzer checklist, review queue ordering — is a *rendering or consumer* of that same JSON. No screen may invent structure that isn't in the JSON.
- The same schema renders into exactly **two consumption views** (user decision):
  1. **Register** — dense, spreadsheet-like operations sheet. Desktop-only. For staff who need the whole loan file at their fingertips, no page-hopping ("Excel energy").
  2. **Segmented step-by-step form** — one section at a time, easy on the eyes. This is also the mobile story.
- The builder is a **form-style schema editor**, never a table-in-edit-mode (explicitly rejected).

### A3. Roles
- `Applicant`, `Originator`, `Underwriter`, `Manager` (permission roles on sections).
- Section `owner` is one of `Applicant | Originator | Escrow | Homium` (the responsible party — distinct from permissions).
- v1 has **no auth**: role is simulated by a header switcher in the UI; the server does not enforce roles. Real auth is a later feature (Part C7).

### A4. Design system — "Ops Desk" (current; the earlier "Ledger" style is retired)
- Mood: at-work, dense, worksheet-like. ~15–20% denser than typical SaaS. User rejected the earlier warm/relaxed style as "too relaxing."
- Ground `#F3F5F7` · surfaces `#FFF` with `#E2E8F0` borders (inner rules `#F1F5F9`, strips `#F8FAFC`).
- Ink `#0F172A` / `#334155` / muted `#64748B` / faint `#94A3B8`.
- Accent + selection + anything automated: blue `#1D4ED8` (hover `#1E40AF`, wash `#EFF6FF`, border `#BFDBFE`).
- Blocker red `#DC2626`/`#B91C1C` on `#FEF2F2`; warning amber `#D97706`/`#B45309` on `#FFFBEB`; ok green `#15803D` on `#F0FDF4` — green used sparingly (accepted / clocks-stopped / clear only).
- Type: **Inter** everywhere (landmarks Inter 600 ≤22px, title case). **IBM Plex Mono strictly for data**: numbers, dates, day counts, IDs, page spans, filenames, clocks. Micro-labels: Inter 600 caps 10–10.5px `#64748B`.
- Shape: radius ≤6px, squared tags (no pills), no in-page shadows (borders carry structure; shadows only on overlays), visible rules between rows, row hover `#F8FAFC`.
- Copy: terse and workmanlike, but keep functional plain-language explanations (flag reasons, expiry rules). **No emojis, ever.**
- Status tags: DRAFT = slate outline, ACTIVE = quiet blue outline. No green fills for status.
- Mobile: breakpoint md/768px; below it, stacked layouts; at/above it, approved desktop layouts stay pixel-identical. Register and Timeline are deliberately desktop-only.

### A5. Header doctrine (applies to every product screen)
- Chrome may only say three things out loud: **whose file, where you can go, what needs doing next**.
- All other metadata (case number, loan type, phase, countdown) demotes into deliberate reveals: a case-card popover on the applicant name, and a ranked "needs you" dropdown on the right.
- Ranking rule: **blockers first** — anything stalling underwriting (missing required docs, flagged docs awaiting verdict) outranks expiring clocks; clocks >30 days out don't earn header space. One urgency surface only.

### A6. AI posture
- AI is **assistive and quiet**: it suggests, a human confirms. It never auto-applies a verdict.
- Automation is visually marked with the accent blue.
- Alarm rules read as plain-language sentences with editable mono tokens, e.g. "newer than [90] days — warn [30d], escalate [7d]".

---

## Part B — BUILT AND RUNNING (v1)

### B1. Scope of v1 (deliberate)
- Template **library**, template **builder/editor**, **saved sections**, **applications + applicant intake form** (with uploads).
- Explicitly OUT of v1: analyzer, review room, register view, timeline, workfile, auth, escalation engine.
- Persistence: **hybrid** (since Jul 2026; originally all-files by user choice, migration to DB user-approved). Operational data — applications and analysis runs — lives in Postgres (`lib/db`, Drizzle): one jsonb document per application, runs as append-only rows. Templates and saved sections remain literal JSON files on disk; packet PDFs/thumbnails/uploads remain disk files until App Storage.

### B2. Architecture
- pnpm monorepo. Frontend `artifacts/client` (React + Vite + wouter + TanStack Query, served at `/`). Backend features inside the shared Express 5 server `artifacts/api-server` (served at `/api`).
- **Contract-first:** `lib/api-spec/openapi.yaml` is the single source of truth. Codegen produces Zod schemas (`@workspace/api-zod`, used by the server for all input/output validation) and typed React Query hooks (`@workspace/api-client-react`, used by the frontend). There is no separate hand-written shared types package — the OpenAPI spec IS the shared contract.
- **Hard modularity rules (user mandate):** mirrored feature folders with identical names on both sides; no file over ~250 lines; no cross-feature imports (except small shared helpers); no `utils.ts` dumping grounds; routes are wiring only; disk IO lives only in store modules.

```
artifacts/api-server/src/
  lib/jsonStore.ts                 # atomic JSON read/write, dir scan helpers
  features/
    template-library/  store.ts router.ts params.ts
    template-editor/   router.ts validate.ts
    saved-sections/    store.ts router.ts
    intake/            store.ts router.ts blocks.ts
    intake-uploads/    router.ts           # multer, 50MB cap
artifacts/client/src/
  features/
    template-library/  TemplateLibrary.tsx
    template-editor/   TemplateEditor.tsx
    saved-sections/    (palette integration)
    intake/            Applications.tsx IntakeForm.tsx
    dimensions/        DocDimensions.tsx helpers.ts   # the ONE dimensions renderer
```

### B3. File store layout & rules
```
artifacts/api-server/data/
  templates/<family>/v<N>.json     # one file per template version
  saved-sections/<id>.json         # one file per reusable section fragment
  applications/<id>.json           # one file per application (embeds full pinned template)
  uploads/<applicationId>/<blockId>/<filename>
```
- Writes are **atomic** (temp file + rename).
- The library index is **always derived by scanning the directory tree** — never a cached index file.
- `inUseBy` counts are **always derived** by counting application files pinned to that family+version.
- Drafts are writable; **active versions are immutable** — PUT returns `409`.
- Path segments used on disk (`applicationId`, `blockId`, `family`) are validated against `^[A-Za-z0-9][A-Za-z0-9_-]*$`; filenames are sanitized via `basename` + character allowlist (path-traversal hardening, post-code-review).

### B4. The template JSON contract (implemented exactly as specified)
Top level:
```json
{
  "template": "Purchase Loan — CA",
  "version": 3,
  "status": "draft | active",
  "program": "Homium Deposit Assistance",
  "alternatives": [ { "id", "name", "primary", "satisfiedBy": ["blockId"] } ],
  "sections": [ ... ]
}
```
- `Section`: `{ id, name, owner: Applicant|Originator|Escrow|Homium, permissions: [{role, view, upload}], subsections: [...] }`
- `Subsection`: `{ id, name, blocks: [...] }`
- `Block` (discriminated by `kind`):
  - `kind: "document"` → `{ id, name, formats: [".pdf", ...], requirement, criticality, sourcing, multiPage?, expiry }`
  - `kind: "fields"` → `{ id, name, fields: [{ id, type: text|number|date|select|yesno, label, required?, options? }] }`
- `expiry`: `{ kind: "staleness", days: N }` | `{ kind: "hard" }` | `null` (see two-clock model, Part C5 — the schema is built; the engine is not).

**The three document dimensions** (orthogonal; never collapse them):
- `requirement` — a RULE: `required | required_alt | recommended | optional`. Does the application proceed without it? `required_alt` means satisfiable by the doc or any member of its alternative group. Replaced the old `required: boolean`.
- `criticality` — a WEIGHT: `critical | standard | supporting`. How much the doc matters to the outcome; drives analyzer scrutiny tier and review-queue ordering. Independent of requirement (a gift letter can be `optional` + `critical`).
- `sourcing` — an INTELLIGENCE TAG: `readily_available | constrained | scarce`. How hard to obtain. **Analysis-only — never rendered as applicant help text** (user explicitly rejected that).

**Alternatives** (the alternative belongs to the requirement, not the document):
- Template-level `alternatives[]`, any-one-of `[primary, ...satisfiedBy]`, members may live in different sections.
- Invariants (server-enforced on save): all ids resolve to existing document blocks; a block is primary of at most one group; `satisfiedBy` non-empty and never contains the primary; block ids unique template-wide.
- UI derives captions both directions: primary → "required — unless Passport (02) is filed"; member → "can satisfy: Proof of Identity (02)".
- v1 restraint: no nested groups, no "2 of 3" quorums, no cross-template references.

**Dimension display rules** (implemented in `DocDimensions.tsx` — the single renderer, used everywhere):
- Exception-based ("hotel amenity" rule): requirement always renders (distinct glyph per level); criticality only when `critical`; sourcing only when `constrained`/`scarce`; alternatives caption only when in a group.
- Variants: `icons` (compact/mobile, tap → tooltip) and `labels` (desktop, quiet mono tokens).
- Transparency: all roles see the same dimensions; restraint comes from the exception rules, not per-audience filtering.

### B5. Template lifecycle (implemented)
- `draft` = editable, NOT assignable to applications. `active` = frozen/immutable, accepts applications. Activation is one-way.
- "Update to a new version" copies vN → v(N+1) **draft**; vN stays active. Concurrent active/draft versions per family are by design.
- Applications **pin a full copy of the template** at creation and keep it forever (template edits never mutate in-flight applications).
- Saved sections are **copies, never links** — inserting one into a template copies the payload; later edits don't propagate.
- Duplicate copies a version into a brand-new family as v1 draft. Retire exists in the UI menu but is disabled (not yet specified).

### B6. API surface (all implemented, Zod-validated in and out)
```
GET    /api/templates                                    → TemplateListing[] (derived index)
POST   /api/templates              {name, program}       → new family v1 draft (409 if family exists)
GET    /api/templates/{family}/{version}                 → full Template JSON
PUT    /api/templates/{family}/{version}                 → save draft (409 if active; 400 on invariant violations)
POST   /api/templates/{family}/{version}/new-version     → vN → v(N+1) draft (409 if newer exists)
POST   /api/templates/{family}/{version}/duplicate {name}→ new family v1 draft
POST   /api/templates/{family}/{version}/activate        → draft → active (409 if already active)
GET    /api/saved-sections                               → SavedSection[]
POST   /api/saved-sections         {name, source, section}
GET    /api/applications                                 → summaries with docsFiled/docsTotal
POST   /api/applications           {family, version, applicantName}  (409 unless version active)
GET    /api/applications/{id}                            → application incl. pinned template
PUT    /api/applications/{id}/fields/{blockId} {values}  → 400 unless blockId is a fields block
POST   /api/applications/{id}/uploads/{blockId}          → multipart "file"; validates block exists,
                                                           kind=document, extension ∈ block.formats (400 otherwise)
DELETE /api/applications/{id}/uploads/{blockId}/{filename}
PUT    /api/applications/{id}/closing-date               → via PUT /applications/{id} {projectedClosingDate}
GET    /api/applications/{id}/analysis                   → AnalysisSidecar (empty shell if no run yet)
POST   /api/applications/{id}/analysis/runs              → analyzer (or simulator) posts a full run; latest run wins
PUT    /api/applications/{id}/verdicts/{blockId}         → human verdict {verdict, decidedBy, documentDate?, expiryDate?, datesEdited}
POST   /api/applications/{id}/packet                     → multipart "file", PDF only; stores packet + runs deterministic
                                                           pre-flight → state=gated, or auto-proceed (<20pp AND 0 flags)
                                                           straight to a run. Encrypted/invalid PDFs → 400, not stored.
POST   /api/applications/{id}/packet/gate                → {decision, decidedBy}; confirmed only with 0 flags,
                                                           bypassed only with flags (else 400); wrong state → 409
GET    /api/applications/{id}/packet/thumbnails/{page}   → pre-flight evidence PNG (2 worst + 1 best page)
```
- Version and status on save always come from the file system, never trusted from the client.
- Server: pino structured logging, Express 5 conventions.

### B7. Frontend pages (implemented, ported from user-approved mockups)
- **App shell** (staff surfaces `/`, `/applications`, `/templates`) — Sheaf brand mark + wordmark + "DOCUMENT OPS" tag, underline tabs Dashboard / Applications / Templates. Builder and intake form keep their own chrome.
- `/` **Dashboard** — stat strip (applications in flight, documents filed, documents outstanding [amber when >0], active templates), "Needs you" card (apps with outstanding docs, most-outstanding first, → intake form), "Form templates" card (families with version/status chips, in-use counts). All numbers derived from the applications + templates list endpoints — nothing hardcoded. Known limit: "outstanding" counts ALL unfiled document blocks (the list endpoint carries no requirement breakdown); required-only blocker ranking lands with the compliance engine.
- `/templates` **Template Library** — families grouped, one row per version, DRAFT/ACTIVE tags, "in use by N applications" (derived), row `…` menu: Edit / Preview / Update to a new version (with mono hint "copies v3 → v4 draft · v3 stays active") / Duplicate / Export JSON (client-side download) / Retire (disabled). New-template button.
- `/builder/:family/:version` **Template Editor** — mirror of the approved FormBuilderA mockup: left palette (Section / Subsection / Document upload / Field group) + SAVED SECTIONS group; numbered collapsible sections with owner tag; per-section permissions strip ("WHO SEES · WHO ADDS", Role × view/upload); block rows with the three dimension dropdowns (Requirement/Weight/Sourcing) and satisfied-by captions; drafts save ("Save Draft"), active versions render read-only; header shows mono version token + status tag (Duplicate/Export live ONLY in the library menu, not here).
- `/applications` **Applications** — list with progress (docs filed / total), start new application against an active version only.
- `/apply/:applicationId` **Intake Form** — the segmented, section-by-section applicant view; header per the header doctrine (applicant name + template token + "VIEWING AS" role switcher); sections filtered by role view permission; document blocks show DocDimensions + upload dropzones restricted to allowed formats; field groups render typed inputs with save; uploads/deletes refetch application state.
- `/applications/:id/:lens?` **Case File** (staff) — the four Backbone lenses as one route (`triage` default | `workfile` | `timeline` | `register`), all rendered from a single pure view model (`features/case-file/caseData.ts: buildCaseModel(app, sidecar, now)`) over `GET /applications/:id` + `GET /applications/:id/analysis`. Case header: applicant + mono id + template token, inline-editable closing target, alarm bell (live clocks ≤30d) → timeline. Verdicts everywhere use the armed two-step accept (arm → confirm document/expiry dates, edits recorded via `datesEdited`) and one-click request-re-scan; `decidedBy` comes from the signed-in test profile. Missing docs get real actions only (open intake / copy applicant link). No analyzer run yet ⇒ honest empty triage state; no fake processing theater (returns as real pre-flight later).
- `/login` **Test sign-in** — 4 seeded staff profiles (click = signed in, localStorage); profile chip in the app shell header. Real auth later; never Clerk.

### B8. Seed data (in the file store now)
- Family `purchase-loan-ca`: v3 **active**, v4 **draft** — 6 sections, 16 documents, 2 field groups, one alternatives group (`proof-of-identity`: gov-id ← passport), realistic dimensions on all documents (mirrors the approved mockup seed).
- Saved sections: "Standard Application", "Income & Assets" (real copies of v3 sections).
- One sample application ("Ana Torres") pinned to v3 with one uploaded file.

---

## Part C — AGREED DIRECTION, NOT YET BUILT

Everything below exists as user-approved high-fidelity mockups (canvas, `artifacts/mockup-sandbox/src/components/mockups/homium/`) and/or explicit user decisions. None of it is production code yet.

### C1. Analyzer (separate build; user researching the AI side independently)
- Input: a single 300+ page loan PDF per application.
- Pipeline: split the bundle into individual documents → classify/name each against the template's document blocks → score each (OCR quality, legibility, tamper/fraud heuristics, cross-field consistency).
- **Scrutiny tiering is deterministic from the JSON dimensions:**
  - `critical` → full pipeline (OCR + fraud heuristics + cross-field consistency).
  - `standard` → standard scoring.
  - `supporting` → classification + legibility only.
- **Substitution scrutiny:** when a requirement is satisfied by an alternative instead of its primary AND the primary is `critical`, the substitute escalates one scrutiny tier and is flagged "satisfied by alternative" for review.
- **Overlap escalation ("deep fraud scan" rule):** `critical`+`scarce`, or `critical` satisfied-by-alternative, or multiple `critical` docs from one section failing quality thresholds ⇒ escalate the whole workfile to a deep scan (fraud heuristics across the document set, not just one file).
- Explicitly out of scope: negative weighting ("documents that hurt the application") — that is reviewer judgment, not schema.
- Unassigned pages that match no block land in an **unassigned bucket** for manual triage.

### C2. Intake / triage screen (mockup: Backbone "Intake" page)
- **Triage report half is BUILT** (see B7 Case File — stat strip, exceptions queue with paired verdicts, covered/unassigned buckets, whisper lines, audit trail — all from live sidecar data).
- **Packet-drop flow BUILT (Jul 24 2026):** dropzone → packet upload → **real deterministic pre-flight** (pdfinfo validity/encryption/metadata · 36-dpi raster with blank-page + exact-duplicate detection · embedded-image DPI <150 check · evidence thumbnails · full-pipeline cost estimate, staff-facing) → **server-persisted state machine** `uploaded → preflight_running → gated → processing → report` — the gate physically blocks the run. Auto rule: <20 pages AND zero flags → `decision=auto`. "Process" (`confirmed`) only with zero flags; "Process anyway" (`bypassed`) only with flags standing; decider recorded from the signed-in profile. Skew/blur are parser-tier and deliberately NOT claimed by pre-flight (sample packet p.8 proves the honesty). While the engine is simulated, runs still POST through the real ingest endpoint (`pipelineVersion: simulated-0.1`) and the UI labels them — SIMULATED chip in the case header + whisper line; ingest failure reverts the packet to `gated` (502, no fake success). Packet events (received/flags/gate decision) land in the audit trail. Test assets: `test-assets/sample-packet-v1.pdf` (9pp, gates with 2 flags) and `test-assets/clean-sample-3p.pdf` (auto-proceeds).
- AI suggests classification and verdicts; a human confirms every one (A6 posture).

### C3. Review room / verification queue
- Humans issue final verdicts on flagged documents.
- **Queue ordering (deterministic):** sort by (criticality of flagged doc, then escalation clock). A `supporting` doc never outranks a `critical` one regardless of age.
- Verdict actions follow the paired-buttons pattern from triage.
- Accepting a document **stops its staleness clock** (see C5).

### C4. Workfile (mockup: Backbone "Workfile" page) — BUILT
- Live as the `workfile` lens (B7): section rail (collapse + mobile chips) from real template sections, status-typed requirement cards (accepted-locked / clean+clock / flagged red-rule with verdicts / missing→intake / covered / requested), "Waiting on others" from requested + missing-supporting docs.

### C5. Expiry engine — the two-clock model (core domain logic; schema already built)
- **Staleness clocks** (`{kind:"staleness", days:N}`): document goes stale N days after its document date (bank statements ≤90d, pay stubs ≤30d). The clock **STOPS permanently when an underwriter accepts the doc**.
- **Hard expiries** (`{kind:"hard"}`): never stop; the document must remain valid **on closing day** (ID validity, credit currency).
- Never conflate the two — this distinction is the product's core scheduling logic (user's domain call).
- Escalation ladder per document: the 90/30/7 pattern — plain-language editable rules ("newer than [90] days — warn [30d] before, escalate [7d] before"). Criticality affects only the *ordering* of expiry alerts, never their timing.
- Derived surfaces: live clocks vs "clocks stopped" shelf; blockers-first ranking feeds the header "needs you" dropdown (A5).

### C6. Timeline & Register — BUILT (desktop-first; horizontal scroll on mobile)
- **Timeline** (`timeline` lens) — validity chart from the two-clock model: today + closing markers, dies-before-deal wash, HARD-EXPIRY / STOPS-ON-ACCEPT chips, stopped-clocks shelf. Window spans the actionable horizon; far-out hard expiries run off the right edge (day chip carries the number).
- **Register** (`register` lens) — dense sheet: section bands with owner + micro-progress, per-row document/received/checks/validity/status columns, "/" search, inline row expansion with scores + verdicts. Export button deliberately absent until it can be real.

### C7. Auth & roles (future)
- **Interim (built):** `/login` test sign-in with 4 seeded profiles; verdicts record the active profile as `decidedBy`. Schema stays auth-shaped so real accounts slot in later. **Never Clerk** (user decision).
- Replace the test sign-in with real authentication; enforce section permissions server-side (v1 sends an advisory `x-role` header concept but does not enforce).
- Same four permission roles; `Manager` is the approver persona for template activation (activation governance not yet specified — open question).

### C8. Known open items / not yet specified
- Retire flow for template versions (menu item exists, disabled).
- What happens to in-flight applications when a family is retired.
- Analyzer's write-path into the portal (verdicts, scores, flags are not in the application JSON yet — the contract will need extending; keep it additive).
- Escalation notifications (who gets warned at 30d/7d and how).
- Multi-applicant / co-borrower files.
- ~~Storage migration path from JSON files to a database if/when scale demands~~ **Done (Jul 2026)** for operational data: applications + analysis runs moved to Postgres with the API contract unchanged — the B3 rules (derived indexes, single-writer semantics) carried over as row-locked transactions (`updateApplication`) and an append-only runs table. Templates/saved sections deliberately stayed files.

---

## Part D — Working agreements (for any AI/dev picking this up)
- Read `docs/homium-template-schema-spec.md` before touching the template contract; extend it additively, never mutate existing semantics.
- Never hand-compute counts shown in UI — derive from the data (a hardcoded count drifted from computed once; rule exists for a reason).
- Any new screen must be a rendering of the template JSON (A2); don't invent third navigation paradigms.
- Ops surfaces prefer inline expansion + popovers over separate pages/modals.
- Change the OpenAPI spec first, re-run codegen, then implement — server validates all IO with the generated Zod schemas.
- Respect the modularity rules (B2) — they are a user mandate, not a style preference.
