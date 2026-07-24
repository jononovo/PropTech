# Future — accepted but deferred

Parking lot for decisions that are made but deliberately not built yet. Don't relitigate; schedule.

## Attribution on edits (parked Jul 24, 2026)
- Verdicts record `decidedBy` from the signed-in test profile — that works today.
- **Closing-date edits (and other application field edits) are NOT attributed** — the application update path carries no `editedBy`, and edits don't appear in the case-file audit trail.
- When to build: with real auth, or earlier if audit pressure demands. Shape: additive — stamp application updates with the acting profile, surface them in the audit trail.

## Already-locked deferrals
- **Template version management screen — v2/v3.** View versions, diff, rollback-via-copy. v1 (shipped Jul 24, 2026) is repin-to-newer-active only: case-file header nudge + additive-only server enforcement + templateHistory audit entries. Rollback today = copy-old-into-new-draft-and-activate.
- **Email infrastructure — v3.** Until then, copy-applicant-link is the request mechanism.
- **Region highlighting on page images — v2** (md-offset→bbox highlight-on-page, liked as a feature in the Filmstrip exploration).
- ~~Filmstrip review room (direction A)~~ — **DONE Jul 24, 2026** (`/applications/:id/review`, see `review.md`). Region highlighting on its page images stays v2 (above).
- **Real authentication** — replaces the 4-profile test sign-in; schema already auth-shaped. Never Clerk.
- **Run history UI** — none, by decision. Latest run wins on every screen; older runs stay on disk in the analyzer sidecar for audit (user confirmed Jul 24, 2026).
- **LangExtract + vector index — v2** (spec cut; v1 fraud = metadata/visual/core-field consistency only).
- **LLM questions / per-application searchable index + chat — after analysis features are done.** Detailed ideas in `_future/llm-questions.md` (user decision Jul 24, 2026: analysis first, index later).

## Engine candidates (need spec-author sign-off)
- **Span-gluing rule:** exclude preflight-flagged blank/duplicate pages from document spans before mapping. Both parse engines absorbed planted blank+dup pages into the grant-deed span (judge caught it each time) — see `models/parse-comparison-2026-07-24.md`.
- **Region crops on demand:** paddle already saves per-page layout elements (bboxes) to `elements/p<N>.json`; crop regions when deep-scan needs them instead of pre-cropping every page.

## Platform / scaling
- **Ingest as job + poll.** Today a packet upload holds the per-app lock through preflight and the gate kick, and `processing` can stand for minutes on long engine runs. When runs get long, move ingest to a job with polling.
- **Multi-file packets ("folder drop").** A packet becomes 1–n files; the drop zone is labeled "Documents". Keeps the spec's "packet" term.
- **Retention + access controls** — required before real (non-synthetic) borrower packets are allowed; until then synthetic packets only (spec gate).
- **Prod legacy packet bytes:** three prod apps uploaded before App Storage lost their bytes to a redeploy (unrecoverable, known). Any packet re-upload heals the affected app.

## Recently resolved (kept for the record)
- ~~Paddle 1.6 pipeline integration~~ — **DONE Jul 24, 2026.** Live spec configuration: Paddle parse (Fireworks deployment `p4tlc3h1`, scale-to-zero, `paddleocr[doc-parser]` client, subprocess-per-packet, batched predict) + GLM text + Claude judge. Interim all-Claude path remains one env flip away (see memory: model-backends). Head-to-head comparison recorded in `models/parse-comparison-2026-07-24.md`.
- ~~App Storage for document bytes~~ — **DONE Jul 24, 2026.** See `persistence.md`.
