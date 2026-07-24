# Page review room — `/applications/:id/review`

**Purpose.** Full-screen filmstrip for clearing a run's *stops* fast: flagged documents and unassigned page ranges, over real page images. The momentum surface — keyboard-first, auto-advancing.

**The thinking.** Direction A from the filmstrip exploration (shipped Jul 24, 2026): reviewing 300 pages must feel like walking, not filing. Priority mode walks only what needs a decision; all-pages mode exists for the skeptic who wants to see everything. **Humans place, AI never does** — placements are the manual counterpart to classification, and "your assignments win" (overlap rule: a new placement drops older overlapping ones).

**How it works.**
- Own route (not a lens; must precede `:lens?` in App.tsx). Entry: Intake "Review pages", triage links, and auto-pivot when a run lands while watching processing.
- `buildReviewModel` (pure, `review/reviewModel.ts`): stops = docs with actionable flags or fraud ≥ 0.3 (band hold/attend) + open unassigned ranges; cells = pages 1..N.
- Page images stream through the API proxy `GET .../runs/:runId/pages/:page?size=full|strip` (analyzer store serves; strip = cached 320px).
- Filmstrip: severity bars, resolved ticks, active ring + autoscroll. Right rail: `VerdictButtons` reuse (armed pattern intact; `armSignal` lets ↵ arm accept) / placement select (file into block via optgroups, or archive) / Acknowledge for clean pages (session-only Set, deliberately unpersisted).
- Keyboard ←/→/↵/esc (ignored while typing); resolve auto-advances after 400ms; esc → intake. Mobile stacks with the rail capped at 46vh.

**Peculiarities.**
- "All clear" empty state when no stops remain.
- Acknowledge is *session* state — reopening the room forgets it (a placement/verdict is the durable act; ack is just walking rhythm).

**Done.** E2e-verified Jul 24, 2026: verdict + auto-advance, filing, archiving, all-pages, keyboard, triage flow-through, mobile.

**Open.**
- *Open — feature:* region highlighting on page images (md-offset→bbox; elements JSON already retained) — v2, `_future.md`.
- *Open — feature:* per-application Q&A/chat — deliberately deferred until analysis features are done (`_future/llm-questions.md`).
- Auto-pivot with a *paid* live run remains untested by standing order (testers must not press Process).
