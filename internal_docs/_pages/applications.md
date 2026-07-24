# Applications list — `/applications`

**Purpose.** Every case in one table + the only place a new application is born.

**The thinking.** Creating an application = **pinning a template version** — the case's contract is immutable from that moment (upgrades are an explicit, additive-only repin later, from inside the case). So the create form is deliberately tiny: applicant name + one *active* template version. Everything else belongs to the case file.

**How it works.**
- `useListApplications` table: applicant, template·version, progress bar (`docsFiled/docsTotal`), state.
- Create: name + active-template select → `POST /applications` → invalidate list → redirect to `/apply/:id` (the applicant form, staff-assisted first pass).
- Only `status === "active"` templates are offered — drafts can't take cases.

**Peculiarities.**
- The component lives at `features/intake/Applications.tsx` — historic naming, the list predates the case-file feature.
- Post-create redirect drops staff into the *applicant-facing* form to seed initial data; a debatable but deliberate flow until real applicant links exist.

**Done.** List, progress, create+pin, active-only filtering.

**Open.**
- *Open — feature:* search/filter/pagination when volume demands.
- *Open — decision:* whether creation should keep landing staff in `/apply/:id` once tokenized applicant links exist.
