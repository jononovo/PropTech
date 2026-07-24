# Review — run report, verdicts, audit

Human-in-the-loop review lives in the case file once a run lands. AI suggests; the human decides — always.

## Report

- **Latest run wins** on every screen — no run-history UI (decided; older runs stay on disk in the analyzer sidecar for audit).
- Shows the segmentation (document spans mapped to checklist blocks, page ranges), the honest **unassigned** bucket, and per-document judge flags with page evidence + preflight cross-references.
- Extracted `document_date` / `expiry_date` are shown at accept time — **editable, and edits are recorded**.
- Honesty rule: a failed analysis fetch renders an **error**, never the "no run yet" empty state.

## Verdicts

- Per document block: `POST /applications/{id}/verdicts/{blockId}`.
- **Two-layer armed pattern** (product-wide doctrine): first click arms the option (siblings dim, optional note field opens), explicit confirm logs it ("Log verdict" / "Log verdict + note"). Cancel disarms. The note travels with the verdict into the audit trail.
- `decidedBy` comes from the signed-in profile — enum `Originator | Underwriter | Manager`, not a free string.

## Page review room (filmstrip)

- Full-screen room at `/applications/{id}/review` — own route, not a lens (route must precede `:lens?`). Entry: Intake "Review pages", triage links, and auto-pivot when a run lands while the user watches processing.
- **Priority mode** walks the stops (flagged docs + open unassigned ranges); **all-pages mode** walks every page. Real page renders stream from the analyzer store via `GET /applications/{id}/runs/{runId}/pages/{page}?size=full|strip` (API proxies analyzer `/store/...`; strip = cached 320px downscale).
- Rail reuses `VerdictButtons` (armed pattern intact; `armSignal` prop lets ↵ arm accept). Keyboard: ←/→ nav, esc to intake.
- **Manual placements**: `POST /applications/{id}/placements` files an unassigned range into a document block or archives it (`target: blockId | "archive"`). Server rule: a new placement drops older overlapping ones; range validated against packet pages. Placements flip the block to `filed`, land in the audit trail, and shrink `unassignedOpen` (triage + review both read the open list). AI never places — humans do; "your assignments win."
- Pure view-model in `features/case-file/review/reviewModel.ts`; stop = doc with actionable flags or fraud ≥ 0.3, or an open unassigned range.

## Audit trail

- Case-file audit records verdicts (+notes), template repins (`templateHistory`), and run arrivals.
- Known gap: plain field edits (e.g. closing date) are unattributed until real auth — parked in `_future.md`.

## Where

- Client: `features/case-file/`.
- Server: `features/analysis/` (runs), verdict handling in the application doc via `updateApplication`.
