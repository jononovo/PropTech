---
name: Incremental (delta) analyzer runs
description: Delta runs union into the latest run blob at ingest; file-keyed worker store; runId removed from page URLs and merge keys.
---

Shipped & e2e-verified Jul 26 2026 (curl fresh-app flow + UI test on 5fCIFghsp1).

**Rule: latest ingested run blob = whole truth.** Delta runs analyze only uncovered active files; ingest unions previous results for untouched files into the new blob (documents, unassigned, input, preflight; satisfaction entries for blocks with docs from BOTH old+new files are omitted — partial-context reads must not masquerade as whole truth). Zero read-path changes anywhere.

**Why:** files are immutable → per-file renders/parses never change; carrying results forward is always sound.

Key decisions:
- Worker store pages/md/elements are FILE-keyed (`store/<app>/files/<fileId>/…`), not run-keyed. Page-image API route is `/applications/:id/files/:fileId/pages/:page`. Each file is parsed exactly once by the run that covers it.
- Merge-resolution keys have NO runId prefix (`<fileId>:pF-L|…`) — server mergeKey.ts and client docGroups.ts must stay in lockstep.
- Covered set = latest run's (cumulative) input; computed INSIDE the row-locked gate tx (updateApplication supports async mutate) to avoid stale-coverage races.
- Ingest carries `requestId` (worker echoes kick's requestId in run body); processing→report flip only when it matches app.run.requestId.
- Gate on empty delta → 409 "Nothing new to analyze". Client FilesPanel shows GateCard over deltaFiles(model) even in report state; IntakePage renders it under the Analysis-complete card.
- OpenAPI regen gotcha: lib/api-zod/src/index.ts has hand-written explicit re-exports that break when generated names change (e.g. GetRunPageImageParams → GetFilePageImageParams).

One-off migrations done: worker store pages/md/elements dirs moved to file-keyed layout; stored mergeResolutions had no entries to migrate.
