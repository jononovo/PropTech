---
name: Homium design direction
description: Decided product architecture and visual language for the Homium Compliance Manager mockups (workflow-builder folder in mockup-sandbox).
---

# Homium Compliance Manager — decided direction

## Product architecture (user decision, July 2026)
One template/schema definition renders into exactly TWO consumption views:
1. **Register** — dense spreadsheet-like operations sheet (bird's-eye, desktop, for staff reviewing the whole loan file). User "absolutely loves" this view.
2. **Segmented step-by-step form** — easy on the eyes, section-by-section, for people filling things out; this is also the mobile/responsive story (the table view is not expected to work well on mobile).
The workflow builder is a schema editor feeding both views, and it must be FORM-style, not a table — the user explicitly rejected "builder as Register in edit mode" (the Schema mock). "Composer" (write left / live multi-target preview right) is the surviving builder direction; "Flow" is the step-by-step working view of an application (journey rail + single working column, no tables).

**Why:** user articulated the split explicitly — operators need everything at their fingertips with no page-hopping (Excel energy), contributors need guided one-thing-at-a-time flow.
**How to apply:** any new screen should be framed as a rendering of the same schema; don't invent third navigation paradigms; ops surfaces favor inline expansion + hover popovers over separate pages/modals.

## Visual language (the "Ledger" family — evolve, don't abandon)
- Warm paper ground #F7F5F0 family; ink #1A1D1A; deep green anchor #2A4D3B; sage supports; clay/amber #B85C38 family strictly for warnings.
- Type: Fraunces (serif) for editorial landmarks only; humanist sans for UI; Space Mono for every number/date/score/token.
- Feel: "fine-press printed register that came alive" — hairlines not heavy borders, dense but serene, crafted hover states, NO emojis.
- AI is assistive and quiet (suggests, human confirms — never auto-applies); alarm-bell rules read as plain-language sentences with editable mono tokens ("newer than [90] days — warn [30d], escalate [7d]").

## Working conventions that proved out
- Mockups live in artifacts/mockup-sandbox/src/components/mockups/workflow-builder/ (Ledger, FieldNotes, GardenPath, Register, Schema, Composer + Application/Intake/Portal in Ledger v1 style).
- Parallel design subagents must not touch index.css or each other's files; self-contained components with own css file if needed.
- User prefers being offered 2 named variants per exploration round, each a distinct hypothesis with stated trade-offs.

## Backbone prototype (Jul 2026 round — approved direction)
Four linked pages under one shell (`homium/Backbone.tsx`, `?page=` switch, shared `homium/data.ts` as single source of truth):
- **Intake** — drop 300-page PDF → staged processing → triage report (stat strip, exceptions queue with PAIRED verdict buttons, unassigned bucket, audit whisper). Arc adopted from the user's Sheaf reference, rebuilt in Ledger material.
- **Workfile** — Flow DNA (journey rail + single working column); forms, never tables.
- **Timeline** — the star: pure-CSS validity chart, today + closing markers, urgency-sorted rows, clay wash for docs that die before closing, "clocks stopped" shelf.
- **Register** — dense sheet + Validity clock column + inline row expansion.

**Two-clock expiry model (user-validated domain insight):** *staleness* clocks (bank stmts ≤90d, pay stubs ≤30d) STOP when the underwriter accepts the doc; *hard* expiries (ID validity, credit currency at closing) never stop and must be valid on closing day. Encode as `kind: "staleness" | "hard"`; helpers liveClocks()/stoppedClocks().
**Why:** this distinction is the product's core scheduling logic and came from the user's domain call — future screens must not conflate the two.
**Canonical counts come from data.ts helpers (stats(), alarmCount()), never hand-computed** — a hardcoded "14/3" drifted from the computed "15/2" across pages this round.
**Sheaf reference verdict:** adopt its intake arc, exceptions-with-paired-verdicts, unassigned bucket, timeline concept; reject its component styling ("sloppy") — everything re-expressed in Ledger tokens.

## Header doctrine (user-corrected, Jul 2026)
A screen's chrome may only say three things out loud: **whose file, where you can go, what needs doing next**. All other metadata (case number, loan type, phase, countdown) demotes into deliberate reveals — a case-card popover on the applicant's name, and a ranked "needs you" dropdown on the right.
**Why:** user rejected the first header ("disgusting") for treating six metadata pieces as equals — "surfacing only the most critical element" is the rule; ambient countdowns and reference IDs are clutter.
**Ranking rule (user's explicit call): blockers first** — anything stalling underwriting (missing required docs, flagged docs awaiting verdict) outranks expiring clocks; clocks >30d don't earn header space. One urgency surface only — no competing badges elsewhere in the chrome.
