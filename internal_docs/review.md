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

## Audit trail

- Case-file audit records verdicts (+notes), template repins (`templateHistory`), and run arrivals.
- Known gap: plain field edits (e.g. closing date) are unattributed until real auth — parked in `_future.md`.

## Where

- Client: `features/case-file/`.
- Server: `features/analysis/` (runs), verdict handling in the application doc via `updateApplication`.
