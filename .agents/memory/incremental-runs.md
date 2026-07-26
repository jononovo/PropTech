---
name: Incremental (delta) analyzer runs
description: Delta runs union into the latest run blob at ingest; file-keyed worker store; runId removed from page URLs and merge keys.
---

Shipped & e2e-verified Jul 26 2026 (curl fresh-app flow + UI test on 5fCIFghsp1).

**Rule: latest ingested run blob = whole truth.** Delta runs analyze only uncovered active files; ingest unions previous results for untouched files into the new blob (documents, unassigned, input, preflight; satisfaction entries for blocks with docs from BOTH old+new files are omitted — partial-context reads must not masquerade as whole truth). Zero read-path changes anywhere.

**Why:** files are immutable → per-file renders/parses never change; carrying results forward is always sound.

Key decisions:
- Renders (pages + thumbnails) live in OBJECT STORAGE, collocated with file bytes: `applications/<folder>/files/<fileId>/pages|thumbnails/p-N.png` (ruled Jul 26: single storage flow; worker disk is scratch). Worker PUTs each PNG to `/applications/:id/files/:fileId/renders/:page?kind=pages|thumbnails` as it renders; API GET `.../pages/:page?size=full|thumb` streams from object storage. "strip" naming is dead — it's "thumbnails"/"thumb" everywhere.
- Approved docs are self-contained: materialize copies span thumbnails to `approved/<basename>/thumbnails/p-N.png` renumbered 1..N (loud 502 if a source thumbnail is missing). Originals in files/ are audit-only — approved viewing must never link back to them.
- Parse md + elements moved to object storage too (Jul 26, same ruling): `files/<fileId>/md/p-N.md` + `files/<fileId>/elements/p-N.json`, pushed by the worker right after parse via `PUT .../files/:fileId/artifacts/:page?kind=pages|thumbnails|md|elements`. Worker `/store` routes deleted; portal never reads from the worker anymore (ANALYZER_URL = kick + health only). Elements wire content-type is octet-stream (app-level express.json would eat application/json); blank pages upload `\n` (route rejects empty bodies). Run-keyed `runs/<runId>/elements/**` projection deleted — citations read file-keyed elements. QA corpus tools exclude `files/` keys (raw per-page artifacts aren't corpus). Worker-only routes are tagged `worker` in openapi.yaml and excluded from ALL TS codegen (orval `filters: { mode: "exclude", tags: ["worker"] }`) — service routes never generate client code.
- SourceFile PATCH accepts `status: active|archived` (ledger file.archived/restored); bytes never deleted. Archived files leave delta gate/estimates/runs.
- Known accepted risk (review flagged): `x-sheaf-service: analyzer-worker` header is unverified service identity scoped to /applications/* — pre-existing owner-accepted pattern.
- Worker store pages/md/elements are FILE-keyed (`store/<app>/files/<fileId>/…`), not run-keyed. Page-image API route is `/applications/:id/files/:fileId/pages/:page`. Each file is parsed exactly once by the run that covers it.
- Merge-resolution keys have NO runId prefix (`<fileId>:pF-L|…`) — server mergeKey.ts and client docGroups.ts must stay in lockstep.
- Covered set = latest run's (cumulative) input; computed INSIDE the row-locked gate tx (updateApplication supports async mutate) to avoid stale-coverage races.
- Ingest carries `requestId` (worker echoes kick's requestId in run body); processing→report flip only when it matches app.run.requestId.
- Gate on empty delta → 409 "Nothing new to analyze". Client FilesPanel shows GateCard over deltaFiles(model) even in report state; IntakePage renders it under the Analysis-complete card.
- OpenAPI regen gotcha: lib/api-zod/src/index.ts has hand-written explicit re-exports that break when generated names change (e.g. GetRunPageImageParams → GetFilePageImageParams).

One-off migrations done: worker store pages/md/elements dirs moved to file-keyed layout; stored mergeResolutions had no entries to migrate.
