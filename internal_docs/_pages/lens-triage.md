# Triage lens — `/applications/:id/triage`

**Purpose.** The report's front page: what the run found, what filed quietly, what needs a human, what's unassigned. Default landing lens once a run exists.

**The thinking.** Exception-first — staff read exceptions, not successes. AI output is framed as *whispers* (display-only commentary) and suggestions; **verdicts are humans-only**, and the armed two-step click pattern prevents accidental decisions. Unassigned is an honest bucket, not shame — "every page found a home" is the goal state.

**How it works.**
- Stat strip: found / filed quietly / need you / unassigned (the unassigned count is **open** ranges — manual placements shrink it).
- Exceptions: per-document rows with judge flags + page evidence → `VerdictButtons` (first click arms — siblings dim, note field opens, extracted dates shown *editable*; explicit confirm logs, edits recorded).
- Unassigned ranges link into the review room ("file in review →"); a centered "open the page review →" link sits under the strip.
- Warns at the top when a *newer packet* is sitting in intake while you read an old report.
- Audit trail (verdicts+notes, repins, run arrivals, placements) renders at the bottom.

**Peculiarities.**
- Whisper lines are per-run static text — deliberately display-only, not a chat.
- `decidedBy` is the signed-in profile's role enum, never free text.

**Done.** Everything above, e2e-verified including placement flow-through from the review room.

**Open.**
- *Stand-in:* "Request re-scan" produces a copy-link (email infrastructure is v3, `_future.md`).
- Nothing awaiting a decision.
