# Dashboard — the front door

`/` lands on a dashboard, not the template library ("front door doctrine": the first screen must carry the brand and the work, not a settings surface).

## What's on it

- **Stat strip** — headline counts across applications/templates.
- **"Needs you" list** — blockers-first ranking: anything stalling underwriting (missing required docs, flagged docs awaiting verdict) outranks expiring clocks. This is the single urgency surface of the app.
- **Templates summary** — quick path into the library at `/templates`.

## Doctrine

- Every count is **derived from the API**, never hardcoded (a hardcoded count drifted from computed truth once in the mockup era; never again).
- Staff routes share the AppShell (Sheaf mark: dark square + inner outline + wordmark + "DOCUMENT OPS" micro-tag). The template builder and the applicant intake form keep their own chrome.

## Where

- Client: `artifacts/client/src/features/dashboard/`.
