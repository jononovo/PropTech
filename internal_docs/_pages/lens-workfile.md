# Workfile lens — `/applications/:id/workfile`

**Purpose.** The resolution desk: work the checklist section by section until nothing needs you.

**The thinking.** Ops staff get **dense sheets with inline expansion** (doctrine) — one section in focus, a rail for orientation, blockers first. The lens opens on the first section that needs attention (`defaultSection`), not section 1.

**History.** DNA from the "Flow" mock — journey rail + single working column, the ops answer to *working* a file (vs Register's bird's-eye; the founding two-views doctrine allows lenses of the schema, never new paradigms). Rail collapse and the mobile chip switcher landed in the menu-doctrine round.

**How it works.**
- Rail: per-section status nodes — three renderings (desktop expanded, collapsed, mobile horizontal scroll).
- `ReqCard` branches on requirement status: `accepted / requested / covered / flagged / missing / filed / clean` — each with its own affordances (VerdictButtons on flagged, MissingActions on missing, dimension chips throughout).
- Cross-lens jump-ins: other lenses call `onLens('workfile', sectionId)`; `focusSectionId` keys a remount so focus lands correctly. "Next section →" sequences the walk.

**Peculiarities.**
- Three rail implementations is deliberate responsive design, not drift — keep them in sync when statuses change.
- "File it through the intake form" on missing items routes to `/apply/:id` — a context jump from staff desk to applicant form.

**Done.** All seven status branches, rail variants, jump-ins, verdict/missing flows.

**Open.**
- *Open — decision:* whether missing-item filing should stay a jump to `/apply/:id` or get an inline staff upload once tokenized applicant links exist.
- Nothing hardcoded.
