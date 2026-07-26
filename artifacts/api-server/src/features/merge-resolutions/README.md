# merge-resolutions

The human decision on an analyzer **merge recommendation** — two run groups the
analyzer filed under the same requirement that a person must declare either
`merged` (one document) or `dismissed` (genuinely separate) before either group
can be approved in the review room.

- `POST /applications/{id}/merge-resolutions` — upsert (latest wins, reversible).
- Stored on the application: `mergeResolutions["<runId>:p<f>-<l>|p<f>-<l>"]`
  (ranges sorted by first page). `mergeKey.ts` builds the key; the client mirrors
  the format in `features/case-file/review/approval/docGroups.ts`.
- The approval gate itself is enforced client-side (assistive workflow, not an
  engine invariant); persistence here is what makes the gate and the audit trail
  survive refreshes and sessions.
- An accepted merge of non-adjacent ranges files as ONE `DocumentApproval` with
  `pageRanges` (see `approved-docs` — materialization extracts the union).
