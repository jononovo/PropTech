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

## Header trigger revision (Jul 23 2026, user call)
- The next-action trigger no longer spells out the top blocker in the chrome ("too much space, super messy, too attention-getting — we're here to work"). It is now a quiet bell icon with a small squared mono count badge: red-tinted only while a true blocker exists, amber otherwise, bare when quiet. Same on mobile (replaces dot+count).
- The ranked blockers-first dropdown is unchanged — severity and detail live one click deeper, never in the chrome. Doctrine now: chrome whispers a count; the queue speaks.

## Page Review room (exploration in progress — user comparing variants)
- New surface: page-level human-in-the-loop review beneath the Workfile's document-level verdicts. AI classifies + scores each page (Quality/OCR/Fraud triad — always shown together), draws %-rect region callouts on CSS-drawn facsimiles (never images), asks ONE plain question per stop. Human verdicts: accept / request / flag to partner (originator|underwriter) / archive. "Hold" band = automated deep review — explicitly not the human's turn; that restraint is a product value.
- Scope choice is first-class: "Priority only" vs "Every page". Stops ≠ pages — contiguous runs (fax covers) collapse into one stop.
- reviewData.ts is the shared contract, derived from data.ts (never fork facts); identical facsimile hints keep variants comparable.
- Three interaction hypotheses live on canvas, Ops Desk skin held fixed: A Filmstrip (conveyor momentum, page is hero), B Queue+Inspector (inbox — command over the set), C Spotlight walkthrough (AI narrates one concern at a time; scope-chooser entry; veil + cutout). Frames homium-review-a/b/c + c-entry. Direction NOT chosen yet.
- Flex lesson (recurring family bug): fixed-content chip clusters need flex-none — flex shrink + overflow-hidden silently clips trailing cells.

## Nav icons revision (user call)
- The four page tabs carry icons: Intake=Inbox, Workfile=FolderOpen, Timeline=History, Register=ListChecks. Desktop = 13px icon + label (icon blue when active); mobile = icon-only 32px tab row in the header (blue wash when active) — pages are one tap away, no sheet needed.
- Mobile hamburger sheet is account-only now (name/role/sign-out + mono case footer); its Pages list was removed as redundant. Trade-off accepted: applicant name truncates harder on 390px.
- Timeline doctrine (user call): the chart IS the alert surface — no banner restating a row it already ranks; days-to-close renders at data size (18px mono inline), never display-type.
- Verdict pattern (user call, built in variant C first): verdicts are two-layer — click arms the option (check + blue outline, siblings dim, key hints hide), an optional note field opens beneath ("travels with the verdict into the audit trail"), confirm logs both ("Log verdict" / "Log verdict + note"). Cancel disarms. `?armed=1` = deterministic demo state. If a review direction is chosen, carry this pattern into it.

## Form Builder exploration (direction not chosen)
- Product sequencing agreed: schema JSON is the contract; builder UI first, analyzer later (user researching separately); portal = React+Vite, not Next. Builder scope locked: single column, sections→subsections→blocks, block kinds document+fields only, JSON file IS the persistence — no flags/notifications/subtitles ever.
- Shared contract: builderData.ts (Template types, PALETTE, PURCHASE_LOAN seed = the Workfile's 6 sections, templateToJson/templateStats/expiryLabel). Variants never fork it.
- FormBuilderA (subagent homium-builder-a): palette-drag hypothesis; JSON behind header toggle drawer; params ?drop=1 ?json=1 ?focus=income. FormBuilderB (homium-builder-b): live-file hypothesis; outline left, inline "+" inserters (?insert=1), right rail = always-visible JSON with selected-block band auto-scrolled into view; ?focus=income.
- Canvas frames at y=11470: builder-a x2821, builder-a-drop x4325, builder-b x5829.
- Builder direction CHOSEN: variant A (palette drag). Reuse layer added per user: sections collapse (header shows quiet mono block/doc summary) and reorder; palette gains SAVED SECTIONS group (SAVED_SECTIONS in builderData.ts); section "…" menu = Save as block / Duplicate section / Remove; header gains quiet "Duplicate" (whole template as starting point). Doctrine: saved sections insert as COPIES, never linked references (v1) — user informed and this framing was accepted. Params now: ?json ?drop=1|2 ?collapsed ?menu ?focus=income. Frame homium-builder-a-reuse x7333 y11470. FormBuilderA is the blueprint for the real React+Vite portal build.
- V3 Composer mined (user pointed at old workflow-builder/Composer.tsx; structure NOT adopted, ideas ported into FormBuilderA in Ops Desk skin): (1) live preview pane — header "Preview" toggle, right 420px recessed pane, Mobile/Desktop/Register segmented + "Previewing as: <role>", device frame renders the selected block's section as applicant cards LIVE from PURCHASE_LOAN, captions "renders from the same JSON — one definition, every view" + "hidden from Applicant: …" derived from permissions; (2) per-section permissions — Section.permissions (Role × view/upload, perms() helper in builderData.ts), edited via slim "WHO SEES · WHO ADDS" toggle strip under the section header (…menu > Permissions), owner stays the responsible party. Params: ?preview=1 ?pview=mobile|desktop|register ?perms=1. Frames: a-preview x8837, a-perms x10341, y11470. Flex-clipping bug recurred (Previewing-as control) — fixed by stacking rows + flex-none whitespace-nowrap.
- Document dimensions (user-driven, spec at docs/homium-template-schema-spec.md — READ IT before building portal/analyzer): requirement is a RULE (required | required_alt | recommended | optional — replaced the Required checkbox with a dropdown), criticality is a WEIGHT (critical/standard/supporting — drives analyzer scrutiny tier + review-queue order), sourcing is an INTELLIGENCE TAG (readily_available/constrained/scarce — analysis-only, NEVER applicant-facing help text; user explicitly rejected "sourcing note" copy). Alternatives belong to the REQUIREMENT not the document: Template.alternatives[] {primary, satisfiedBy[]}, any-one-of, cross-section; captions derived both directions ("required — unless Passport (02) is filed" / "can satisfy: Proof of Identity (02)"). Overlap rule: critical+scarce or critical-satisfied-by-alternative ⇒ deep fraud scan. No negative weighting (docs that hurt) — reviewer judgment. Block type keeps deprecated required:boolean for variant-B compat. Params: ?focus=identity selects gov-id (demo of alt row). Frame a-dims x11845 y11470. Preview pane must derive section from selected block (was a bug once).
- DocDimensions component (homium/DocDimensions.tsx): the ONE renderer for document dimensions everywhere, derived purely from JSON. variant="icons" (mobile: 14px slate glyph row, tap → dark #0F172A mono tooltip, floating-panel shadow allowed) / variant="labels" (desktop: quiet mono tokens). EXCEPTION-BASED display (user call, "hotel amenity" metaphor, transparency for all roles but no icon soup): requirement always renders (asterisk/link/plus/dashed-circle per level); criticality only when critical (diamond); sourcing only constrained/scarce (globe variants); alternatives icon only when in a group. Doctrine recorded in spec §4b. Params: ?tip=1 opens the tooltip on gov-id's first icon. Frame a-icons x13349 y11470.
- REAL PORTAL BUILT (Jul 24, 2026): artifacts/client (react-vite, previewPath "/") + backend features in artifacts/api-server/src/features/{template-library,template-editor,saved-sections,intake,intake-uploads}. Contract = lib/api-spec/openapi.yaml + generated Zod/React Query clients (no separate shared lib — deliberate adaptation of the build spec to workspace conventions). Persistence = JSON files under artifacts/api-server/data/{templates/<family>/vN.json, saved-sections, applications, uploads} — user's explicit no-DB choice; library index and inUseBy always derived by directory scan, active versions immutable (409), atomic temp-file writes. Seeded purchase-loan-ca v3 active + v4 draft from mockup PURCHASE_LOAN via artifacts/api-server/scripts/seed.ts. Intake endpoints validate block existence/kind/format and filesystem-safe id segments (post-review hardening).
- Form Library (homium/FormLibrary.tsx, frame homium-form-library x14853 y11470, ?menu=1 opens row menu on Purchase CA v3): templates grouped by FAMILY with one row per VERSION. Lifecycle doctrine: draft = editable + not assignable; active = frozen + in use; "Update to a new version" copies vN → vN+1 draft while vN stays active; applications PIN the version they started on (concurrent versions by design — user request). Status tags: DRAFT slate outline, ACTIVE quiet blue outline — no green, no fills. Row "…" menu: Edit / Preview / Update to a new version (with mono hint "copies v3 → v4 draft · v3 stays active") / Duplicate / Export JSON / Retire (disabled). Builder header no longer has Duplicate/Export JSON — replaced by mono version token + status tag; those actions live ONLY in the library row menu. Schema: Template.status, TemplateStatus, TEMPLATE_INDEX in builderData.ts.
