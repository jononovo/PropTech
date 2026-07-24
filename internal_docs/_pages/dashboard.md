# Dashboard — `/`

**Purpose.** The front door: what needs a human *right now*, then the portfolio at a glance (applications in flight, active templates).

**The thinking.** Blockers-first doctrine — one urgency surface, no vanity charts. A dashboard that opens with successes buries the job. Counts are **always derived** from live data, never hardcoded; if the number is wrong, the data is wrong, loudly.

**How it works.**
- `useListApplications` + `useListTemplates`, nothing else.
- "Needs you" = applications where `docsFiled < docsTotal`, sorted by open-document count, then recency.
- Stat strip and template groupings (by `family`) are derived in-component.
- Rows link straight into the case file (which lands on triage when a run exists, intake otherwise).

**Peculiarities.**
- Deliberately thin: no polling, no realtime — it's a landing surface, freshness comes from navigation.

**Done.** Fully dynamic; no placeholder data anywhere on the page.

**Open.**
- *Open — feature:* no pagination/filtering — fine at demo scale, revisit when the list endpoints do.
- Nothing awaiting a decision.
