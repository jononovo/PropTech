# case-file/approved

Read-only surface of the approved-document registry (Phase 3D).

- `ApprovedDocsPanel.tsx` — lists live registry rows (basename, requirement,
  variant label, page ranges, approver, date) with PDF/MD download links via the
  existing `/approved-docs/:id/file` endpoint. Superseded rows collapse behind a
  history toggle. The "incomplete — new version requested" badge is derived from
  the application's `documentApprovals` trail (`approvedDocId` → outcome), so no
  server change was needed.
- Rendered at the bottom of the **Register** lens. Renders nothing while the
  registry is empty.
- Strictly read-only: approvals happen in the review room (per-document flow)
  or via block verdicts — never here.
