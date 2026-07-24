# Persistence — Postgres + App Storage

Two stores, one rule: **operational truth in Postgres, document bytes in App Storage.** The prod filesystem is ephemeral — nothing durable may live on disk.

## Postgres (via `lib/db`, Drizzle)

| Table | Shape | Notes |
| --- | --- | --- |
| `applications` | one **jsonb doc** per row | OpenAPI contract is the schema while the product shape still moves |
| `analysis_runs` | append-only rows | unique `(application_id, run_id)` = ingest replay protection |
| `templates` | jsonb, PK (family, version) | |
| `saved_sections` | jsonb, PK id | |
| `users` | flat columns | demo profiles, plaintext passwords by design |

- **Seed-on-boot**: committed JSON fixtures under `artifacts/api-server/data/` populate empty tables (dev and prod, first boot after publish). Fixtures are the seed corpus, not the store.
- All application writes go through `updateApplication(id, mutate)` — row-locked transaction (see `applications.md`).
- After schema changes: `pnpm --filter @workspace/db run push` **and** `pnpm --filter @workspace/db exec tsc -b` (composite project — stale `dist/` d.ts otherwise).

## App Storage (document bytes, Jul 2026)

- Layout under `PRIVATE_OBJECT_DIR` — `lib/packetObjectStore.ts` is the **only module that knows it**:
  - `packets/<appId>/packet.pdf`
  - `packets/<appId>/thumbs/page-N.png`
  - `uploads/<appId>/<blockId>/<file>`
- Serving URLs unchanged by the migration — client and analyzer still fetch over HTTP.
- Missing object → explicit 404. **No disk fallback, deliberately** — explicit failure over silent staleness.
- Write order doctrine: bytes first, record second (orphan object harmless; dangling record not).
- The bucket is **shared between dev and prod**.
- Legacy `data/packets|uploads/` dirs are a one-time backfilled backup only. Backfill script: `artifacts/api-server/scripts/backfill-bytes-to-app-storage.mjs` (idempotent).

## Git doctrine

Loan-document bytes never enter git history (spec-author directive): `artifacts/api-server/data/packets|uploads/` and `services/analyzer/store/` are gitignored. Templates/users/applications fixtures are committed.

## Analyzer store

`services/analyzer/store/` stays **local by design** — it's the engine's workspace (run artifacts, crops, renders); the worker re-fetches packet bytes per run over HTTP.
