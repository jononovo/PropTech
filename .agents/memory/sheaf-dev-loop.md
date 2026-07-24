---
name: Sheaf dev loop
description: How to run/test the Sheaf monorepo day-to-day — restart rules, API access from shell, packet test assets.
---

# Sheaf dev loop

- **api-server dev script is build-then-start (esbuild → node dist), NO file watching.** Any server-side edit requires restarting the `artifacts/api-server: API Server` workflow or you will test stale code. The client (`artifacts/client: web`) is Vite with HMR — no restart needed for client edits.
  - **Why:** an entire debug round was wasted re-hitting old server code after an edit; the usage-error output even showed the pre-edit command line.
  - **How to apply:** after editing anything under `artifacts/api-server/src/`, restart the workflow before curling or screenshotting.
- From the shell, the API is reachable at `http://127.0.0.1:80/api/...` (shared proxy routes `/api` to the api-server artifact). The client reaches it with root-relative `/api/...` URLs — same convention as the generated api client.
- **Packet test assets** (both synthetic, "SAMPLE"-marked, regenerable):
  - `test-assets/sample-packet-v1.pdf` (9 pages, via `node test-assets/make-sample-packet.mjs`) — pre-flight catches p.6 blank + p.7 duplicate of p.3 → state `gated`, "Process anyway" path. Page 8 is skewed on purpose and deliberately NOT caught (parser-tier concern).
  - `test-assets/clean-sample-3p.pdf` (via `node test-assets/make-clean-sample.mjs`) — clean, <20 pages → gate `auto`, straight to report.
- Packet state atomicity lives in the DB now (row-locked `updateApplication` transactions — gate races 409 across instances); the in-process per-app lock only serializes packet DISK work (upload path: preflight + rename + auto-ingest run inside it). The `processing` state blocks competing mutations during ingest. When the real engine arrives (long runs), move ingest to job + poll — today an upload would hold the lock and `processing` would stand for minutes.
- **Postgres operational store** (`lib/db`): applications = one jsonb doc per row; analysis runs = append-only rows, unique (application_id, run_id) → duplicate ingest 409. Templates/saved sections stay JSON files; packets/uploads/thumbs stay on disk until App Storage. One-off file→DB import script: `lib/db/scripts/import-json.mjs` (idempotent).
  - **Why:** gate concurrency had to survive multi-instance deploys; jsonb doc keeps the OpenAPI contract as the schema while the product shape still moves.
  - **How to apply:** never write an application outside `insertApplication`/`updateApplication(id, mutate)` — mutate may throw `HttpError(status, msg)` to abort with a mapped response. Never hold the tx across preflight/ingest.
- **`lib/db` is a composite TS project:** after schema changes run `pnpm --filter @workspace/db run push` AND `pnpm --filter @workspace/db exec tsc -b` — api-server typecheck resolves it via `dist/*.d.ts`, so stale dist yields TS2305 "no exported member" even though the source is right.
- E2E probe gotchas: verdict `decidedBy` must be enum `Originator|Underwriter|Manager` (not a free string); packet thumbnails exist ONLY for flag-evidence pages (`pickThumbnails`) — probe a page from `.packet.preflight.thumbnails[].page`, not page 1.

## Pipeline dev drivers (2026-07-24)
- /tmp scripts die with container recycles. Durable drivers live in artifacts/api-server/scripts/: run-packet.mjs (upload→gate→poll→print run; POLL_SECS env) and repin-template.ts (move app to newer template version, validated, via updateApplication; pnpm dlx tsx).
- Packet endpoints return the FULL application doc — packet fields nested under .packet (state/pages/preflight.flags/lastRunError), not top-level.
- DATA_DIR (jsonStore) was cwd-relative -> prod (different cwd) read an EMPTY dir and the template library showed "0 families" in production while dev was fine. Now probes candidates (env DATA_DIR > cwd/data > cwd/artifacts/api-server/data, first with templates/ present) and logs the resolved path at boot. Templates/saved-sections are file-backed and COMMITTED (only data/packets + data/uploads are gitignored); applications are Postgres. Prod filesystem is ephemeral: templates created in prod UI vanish on redeploy — durable fix (move template store to Postgres) proposed, not approved.
