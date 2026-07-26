# Incremental (delta) analyzer runs — technical plan

Problem: after a run lands, more files can be dropped (they land durably, pre-flight runs)
but the gate never reappears — there is no way to analyze them. Naive fix (re-open the gate
over ALL active files) would re-spend on every already-analyzed page and orphan run-keyed
decisions.

## Design principle

**"Latest run = the whole truth" stays the invariant.** Every consumer already assumes it
(caseData, ReviewPage, citations resolver, qa-agent tools, materializeApproval, sidecars).
Instead of teaching them all to compose across runs, we make the invariant true at ingest:
a delta run is unioned with the previous latest run before it is persisted. Zero changes to
any read path.

## A. Delta gate (server: `features/runs/router.ts`)

- `coveredFileIds(app)` = fileIds in the latest landed run's (cumulative) input.
- Gate + estimate operate on the **delta**: active analyzable files minus covered ones.
- Gate is allowed in `report` state when the delta is non-empty; `processing` still 409s;
  empty delta 409s ("nothing new to analyze").
- `app.run.input` = the delta (exactly what the worker is kicked with — worker already
  fetches only the files in its kick payload; no worker pipeline change).

## B. Ingest union (server: `features/analysis/router.ts`)

On POST /analysis, before validation/persist/sidecars:
- Load the previous latest run blob (if any).
- Carry forward `documents`, `unassigned`, and per-file sidecar/element source data for
  every file NOT in this run's declared input.
- Merge `input` lists (cumulative — this is what makes `coveredFileIds` in A trivial).
- Persist the unioned blob as the new run; sidecars + citation elements regenerate from it
  as they already do, so the new `runs/<runId>/` corpus dir is complete.

The `analysis_runs` table stays append-only; history is preserved; `latestRunId` selection
is untouched.

## C. Remove runId from merge-resolution keys (code removal)

`mergeResolutionKey` is `runId:fileId:pF-L|…` — but spans are file-native and files are
immutable, so the runId prefix only silos human decisions per run (they'd be orphaned by
every new run). Drop it, in lockstep server (`merge-resolutions/mergeKey.ts`) and client
(`review/approval/docGroups.ts`). One-off: strip the prefix from stored keys on the two
live apps (or accept re-resolving open recommendations — zero-backcompat doctrine).

## D. Remove runId from page-render storage/URLs (code removal)

Page PNGs are a deterministic function of the immutable file bytes — the run segment in
`store/<app>/<runId>/files/<fileId>/pages/…` was never information.
- Worker: store renders under `store/<app>/files/<fileId>/…`; route loses `{run_id}`.
- API proxy route `GET /applications/:id/runs/:runId/files/:fileId/pages/:n` →
  `/applications/:id/files/:fileId/pages/:n`.
- Client `globalPageImageUrl` loses the runId argument.
- One-off `mv` of the existing worker store dirs for the two live apps.
- Delta runs then render only the new files' pages; old thumbnails keep working with no
  carry-forward machinery.
- Per-page md/elements under the run dir stay run-keyed (they depend on the parse engine
  chosen for the run); B's carry-forward covers them.

## E. Client intake (`FilesPanel.tsx`, `IntakePage.tsx`)

- `FilesPanel` in `report` state: delta files present → render the existing `GateCard`
  over the delta (header copy: "N new files"); no delta → null (as today).
- IntakePage's "add more files" dropzone is already correct.
- Review page, triage, timeline: no changes — the latest run is simply cumulative now.

## Non-goals (explicitly out)

- Re-analyzing an already-analyzed file (files are immutable; replace = new file).
- Any per-run history/diff UI.
- Analyzer-suggested merges across old+new files (it only sees the delta; humans merge
  cross-run in the review room as they already can once C lands).

## Order & verification

D → C (standalone removals, verify app still fully works) → A + B together → E.
E2E: on the live test app, drop one new PDF post-report, gate shows only its pages/cost,
run lands in ~1 file's time, filmstrip grows, prior groups/verdicts/resolutions intact.
