# Template library — `/templates`

**Purpose.** Lifecycle desk for template families: create a family, cut new versions, activate drafts, duplicate families.

**The thinking.** Templates are **versioned per family**; `active` = assignable to applications and frozen (read-only in the editor), `draft` = editable and unassignable. Case upgrades are pull-based (nudge inside the case panel), never pushed from here. Rollback = copy-old-into-new-draft-and-activate — a version-management screen (view/diff/rollback) is parked v2/v3 in `_future.md`; don't relitigate.

**History.** Direct port of the FormLibrary mockup: family × version rows, outline-only status tags (no green fills — Ops Desk rule), the mono "copies v3 → v4 draft · v3 stays active" hint, and Retire already disabled *there* (never specified — the port is faithful, not lazy). Duplicate/Export were deliberately moved out of the builder header into this row menu.

**How it works.**
- `useListTemplates` grouped by `family`; per-version menus keyed `${family}-v${version}`.
- Actions: `useCreateTemplate` (new family) · `useCreateNewVersion` (clone vN → vN+1 draft) · `useActivateTemplate` · `useDuplicateTemplate`. The API owns version numbering; UI only displays `nextVersionNumber`.

**Peculiarities.**
- Activation is one-way today (see Retire below).

**Done.** Full family/version lifecycle above; grouping; draft-vs-active affordances.

**Open.**
- *Stand-in:* new families still skip a create form — auto-named `"New Template N"` (first free slug) / program `"General"`, and creation failures toast the server's reason (fixed Jul 25, 2026 — was a silent 409 on the fixed default name). Proper name/program form remains *Open — feature*, small.
- *Stand-in:* **Export JSON** just fires a browser `alert()` (*Open — feature*).
- *Open — decision:* **Retire version** button is permanently disabled — retirement semantics (what happens to cases pinned to it?) were never ruled on.
- *Open — feature:* version management screen (diff/rollback) — parked, `_future.md`.
