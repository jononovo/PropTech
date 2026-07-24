# Template library — `/templates`

**Purpose.** Lifecycle desk for template families: create a family, cut new versions, activate drafts, duplicate families.

**The thinking.** Templates are **versioned per family**; `active` = assignable to applications and frozen (read-only in the editor), `draft` = editable and unassignable. Case upgrades are pull-based (nudge inside the case panel), never pushed from here. Rollback = copy-old-into-new-draft-and-activate — a version-management screen (view/diff/rollback) is parked v2/v3 in `_future.md`; don't relitigate.

**How it works.**
- `useListTemplates` grouped by `family`; per-version menus keyed `${family}-v${version}`.
- Actions: `useCreateTemplate` (new family) · `useCreateNewVersion` (clone vN → vN+1 draft) · `useActivateTemplate` · `useDuplicateTemplate`. The API owns version numbering; UI only displays `nextVersionNumber`.

**Peculiarities.**
- Activation is one-way today (see Retire below).

**Done.** Full family/version lifecycle above; grouping; draft-vs-active affordances.

**Open.**
- *Stand-in:* new families are created as literal `"New Template"` / program `"General"` — no create form yet (*Open — feature*, small).
- *Stand-in:* **Export JSON** just fires a browser `alert()` (*Open — feature*).
- *Open — decision:* **Retire version** button is permanently disabled — retirement semantics (what happens to cases pinned to it?) were never ruled on.
- *Open — feature:* version management screen (diff/rollback) — parked, `_future.md`.
