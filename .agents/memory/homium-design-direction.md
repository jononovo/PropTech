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

## STYLE PIVOT — Ops Desk (Jul 23, 2026). Ledger is RETIRED for the product UI.
User verdict: Ledger was "too relaxing — we're at work now; more like an Excel sheet." Chose "Ops Desk" from three offered directions (over light worksheet-green and dark terminal).
**Tokens:** ground #F3F5F7 · surface #FFF with #E2E8F0 borders (inner rules #F1F5F9, strips #F8FAFC) · ink #0F172A / #334155 / muted #64748B / faint #94A3B8 · accent+selection+automation blue #1D4ED8 (hover #1E40AF, wash #EFF6FF, border #BFDBFE) · blocker #DC2626 / text #B91C1C on #FEF2F2/#FECACA · warning #D97706 / text #B45309 on #FFFBEB/#FDE68A · ok #15803D on #F0FDF4 (sparing — accepted/stopped/clear only) · neutral hold #475569 on #F8FAFC.
**Type:** Inter everywhere; landmarks Inter 600 ≤22px title case (serif voice is dead — no Fraunces, no italics). IBM Plex Mono for DATA ONLY (numbers, dates, day counts, IDs, page spans, filenames, clocks). Micro-labels/column headers: Inter 600 caps 10–10.5px #64748B (no longer mono).
**Shape:** radius ≤6px (4 cards/buttons, 3 squared tags — pills are dead); no in-page shadows (borders carry structure; shadow only on overlays); visible worksheet rules between rows/columns; row hover #F8FAFC; ~15–20% denser than Ledger. Primary buttons blue/white; secondary white + #CBD5E1 border.
**Copy:** terse, workmanlike; keep functional plain-language notes (flag explanations, expiry rules); counts always from data.ts helpers.
**Scope:** all homium/* backbone files; shell (Backbone.tsx) owns the single Google Fonts import (Inter + IBM Plex Mono). Old workflow-builder mockups stay Ledger — historical record, do not convert.
**Why:** explicit user mood pivot; product logic (blockers-first header, two-clock model, form-not-table) unchanged.
**Truncation gotcha:** Tailwind `truncate` on a `flex` container clips without ellipsis — put `truncate` on an inner block/span child instead.

## Mobile pass (Jul 23 2026)
- Breakpoint doctrine: md (768px). Below md = stacked mobile; at/above md the approved 1440 layout must stay pixel-identical (mobile-first classes, desktop styling behind `md:`).
- Header mobile: mark + applicant name (flex-1, truncate) + next-action as dot + queue-count + hamburger. Wordmark, avatar, dividers, inline tab row hidden. Tabs move into hamburger sheet (active = blue + square dot, mono case-id footer). `?open=nav` added for screenshots.
- All header dropdowns share one PANEL recipe: `fixed inset-x-2 top-[58px]` full-width sheet on mobile, `md:absolute` anchored dropdown on desktop.
- Workfile mobile: journey rail → horizontally scrollable chip switcher pinned on top, whisper line above it; WAITING ON OTHERS moves to page bottom; buttons full-width. Intake mobile: case strip stacks with closing target as bordered footer row.
- Timeline + Register are intentionally desktop-only (user's explicit scope call).
- **Gotcha:** percentage max-width (`max-w-full`) on a child of an intrinsically-sized flex item (`flex-none`) collapses toward min-content → phantom text truncation at desktop widths. Scope % max-widths to the breakpoint that has a real constraint (`max-w-full md:max-w-none`).
- Canvas: two live phone frames (390×844, `?page=intake` / `?page=workfile`) sit right of the desktop backbone frame (`homium-backbone-m-intake`, `homium-backbone-m-workfile`).

## Menu doctrine (Jul 23 2026)
- Avatar → account menu, utilities ONLY (profile/prefs, notification rules, shortcuts, sign out, mono email footer). Never put work or urgency in it — the next-action queue stays the single urgency surface. Mobile: avatar stays hidden; account folds into the hamburger sheet as a name+role+sign-out row above the mono case footer.
- Workfile journey rail is collapsible (desktop): ghost PanelLeft toggle in rail header → 52px spine of mono section numbers, attention dots preserved top-right, active = blue wash + 2px left rule, waiting-on-others becomes hourglass+count cell; form column breathes to ~880px. `?rail=collapsed` forces it for screenshots. Mobile chip row IS the collapsed state.
- Global nav stays top tabs while destinations are 4 case-scoped lenses of one file — a left sidebar would duplicate tabs and steal width from the width-hungry pages (Workfile/Timeline/Register). A global sidebar earns its place only when app-level destinations exist (case queue, reports, admin) — agreed growth path.
