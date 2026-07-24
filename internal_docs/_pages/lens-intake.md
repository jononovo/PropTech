# Intake lens — `/applications/:id/intake`

**Purpose.** Where documents enter: packet upload → deterministic preflight → human gate (with model-plan pick) → processing → run lands. Plus per-block routes into the applicant form (open form / copy link).

**The thinking.** "Quiet automation — you'll only be asked about exceptions." Two-step choreography is a product value: **no AI before the gate**, a human approves spend, and every state is honest (failures revert and surface; no silent hangs, no fake progress). The gate is also where cost is shown (Originator and above).

**How it works.**
- `PacketPanel` renders the persisted state machine: `uploaded → preflight_running → gated → processing → report` (run-failed → back to `gated` + error).
- Gate card: preflight flags in plain language, evidence thumbnails (flagged pages only), full-pipeline cost, **run-plan picker** — per-stage dropdowns from the worker's option registry (`GET /api/models/options`); the chosen plan travels with the approval and freezes into the run. **Auto-proceed is suspended** — every packet gates so staff pick the plan.
- During `processing`: 2.5s poll of application+analysis. When the run lands while the user watches, the page **auto-pivots to the review room**; `RunLandedCard` offers "Review pages" (primary) / "Open the report".

**Peculiarities.**
- Process buttons spend real money — testers are standing-ordered never to click them.
- Preflight gates, never retouches (no image "enhancement", ever — spec).

**Done.** Full pipeline UX incl. plan picker, auto-pivot, honest failure surfacing; verified on real runs.

**Open.**
- *Stand-in:* `ConnectorsRow` (Google Drive / Dropbox / Box) is decorative and disabled — awaiting an integrations decision.
- *Open — feature:* live stage-progress during `processing` (today it's a poll + patience); multi-file packets ("folder drop") parked in `_future.md`.
