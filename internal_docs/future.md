# Future — accepted but deferred

Parking lot for decisions that are made but deliberately not built yet. Don't relitigate; schedule.

## Attribution on edits (parked Jul 24, 2026)
- Verdicts record `decidedBy` from the signed-in test profile — that works today.
- **Closing-date edits (and other application field edits) are NOT attributed** — the application update path carries no `editedBy`, and edits don't appear in the case-file audit trail.
- When to build: with real auth, or earlier if audit pressure demands. Shape: additive — stamp application updates with the acting profile, surface them in the audit trail.

## Already-locked deferrals
- **Email infrastructure — v3.** Until then, copy-applicant-link is the request mechanism.
- **Parser upgrade to PaddleOCR-VL 1.6** — no longer an infrastructure project: Fireworks lists 1.6 as an on-demand deployment (verified at source Jul 24, 2026). Once the Fireworks key exists, the swap is config. Trigger it on accuracy need vs GPU-hour cost, not effort. (Spec v0.6.2's "self-hosted vLLM only" endpoint line is stale on this one point; no newer spec revision exists.)
- **Self-hosted 1.6 (official vLLM Docker on serverless GPU)** — fallback only if Fireworks pricing/terms stop working.
- **Region highlighting on page images — v2.**
- **Filmstrip review room (direction A)** — after the case file + engine land.
- **Real authentication** — replaces the 4-profile test sign-in; schema already auth-shaped. Never Clerk.
- **Run history UI** — none. Latest run wins on every screen; older runs stay on disk in the sidecar for audit (user confirmed Jul 24, 2026).
