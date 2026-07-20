---
name: Homium design direction
description: Decided product architecture and visual language for the Homium Compliance Manager mockups (workflow-builder folder in mockup-sandbox).
---

# Homium Compliance Manager — decided direction

## Product architecture (user decision, July 2026)
One template/schema definition renders into exactly TWO consumption views:
1. **Register** — dense spreadsheet-like operations sheet (bird's-eye, desktop, for staff reviewing the whole loan file). User "absolutely loves" this view.
2. **Segmented step-by-step form** — easy on the eyes, section-by-section, for people filling things out; this is also the mobile/responsive story (the table view is not expected to work well on mobile).
The workflow builder is a schema editor feeding both views (two candidate takes exist: "Schema" = Register in edit mode; "Composer" = write left / live multi-target preview right).

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
