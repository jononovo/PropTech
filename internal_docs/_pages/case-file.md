# Case file — `/applications/:id/:lens?` (chrome + routing)

**Purpose.** The case is one page with five lenses over a single `CaseModel` — intake (docs in), triage (report front page), workfile (resolution desk), timeline (clocks), register (index). This doc covers the chrome and routing; each lens has its own doc.

**The thinking.** Single-header redesign (Jul 24, 2026, per the Backbone mockup): **inside a case the global nav disappears** — the header says only *whose file / where you can go / what needs doing next*. Everything the old two-row header held moved one reveal deeper into the applicant-name panel. Dashboard/Applications/Templates live in the avatar menu everywhere.

**History.** The Backbone round established "lenses over one file" and top tabs over a sidebar — a sidebar would duplicate the tabs and steal width from the width-hungry lenses; it earns its place only when app-level destinations exist. The header took three user corrections to land: the first draft was rejected for treating six metadata pieces as equals → the three-things doctrine; the spelled-out next-action trigger was demoted to a quiet bell count ("chrome whispers a count; the queue speaks"); Jul 24, 2026 folded the two-row chrome into the single bar + case panel.

**How it works.**
- One 52px bar: Sheaf logo (→ `/`) | **applicant name ⌄** | uppercase lens tabs (right-aligned; triage carries a red attention count, timeline an amber alarm count) | bell | avatar menu.
- **Case panel** (name dropdown): app id + `SIMULATED RUN` chip (when `pipelineVersion` says so), applicant/template·version/program rows, template-upgrade nudge (only when a newer active family version exists; additive-only repin), closing-target row (click → inline date edit), "← All applications".
- **Bell** = live-clocks count, click → timeline lens (the mockup's needs-you queue dropdown was consciously *not* built — see Open).
- Lens routing: no lens in URL → `triage` if a run exists else `intake`. `/review` is its own route and **must precede** `:lens?` in App.tsx.
- Mobile: icon-only tabs, panels drop as full-width sheets; loading/error states get a bare header (logo + avatar).

**Peculiarities.**
- `useCaseFile(id)` builds the whole `CaseModel` client-side from application + analysis; all five lenses and the review room derive from it. Counts are derived, never stored.
- Closing-date edits are **unattributed** (no `editedBy` on application updates) — parked in `_future.md` until real auth.

**Done.** Single header + panel + avatar menu shipped and e2e-verified (desktop/mobile) Jul 24, 2026.

**Open.**
- *Open — decision:* bell as needs-you queue dropdown (mockup) vs current count→timeline. Deliberately kept small.
- *Open — feature:* edit attribution (with real auth).
