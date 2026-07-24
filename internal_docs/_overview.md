# Sheaf — Platform Overview

Document-ops platform for lending compliance: define document templates, collect applicant documents, run 300-page loan packets through an AI analyzer, and record human verdicts. **Sheaf is the product brand; Homium is the client** whose deposit-assistance program runs inside it — no Homium branding anywhere in the app shell.

End-to-end flow: **sign in → pick/build template → create application → applicant intake → packet upload → preflight gate → analyzer run → human review + verdicts → audit trail.**

## Documents in this folder

| File | Covers |
| --- | --- |
| `_overview.md` | This file — architecture + how we build. |
| `_future.md` | Parking lot: decided-but-deferred work. Don't relitigate; schedule. |
| `auth.md` | Demo sign-in (4 seeded profiles). |
| `dashboard.md` | Front door: stat strip + blockers-first "Needs you". |
| `templates.md` | Template families/versions, builder, saved sections, document dimensions. |
| `applications.md` | Application/case-file data model, pinned templates, repin. |
| `intake.md` | Applicant-facing form + per-block document uploads. |
| `packet-pipeline.md` | Packet upload → preflight → gate → processing → report state machine. |
| `analyzer.md` | Python worker: parse → split/classify → judge → scrutiny → ingest. |
| `review.md` | Run report in the case file, verdicts, audit trail. |
| `persistence.md` | Postgres operational store + App Storage document bytes. |
| `models/` | Model & analysis-stage tracking: `_index.md` (contract + swap recipes + status) + `parse.md` / `text.md` / `judge.md` + dated comparisons. |

Dated working notes live alongside; model-behavior comparisons go in `models/`. **Keep these docs in sync when features change.**

## Architecture

pnpm monorepo, three runtime pieces + shared libs:

| Folder | Role |
| --- | --- |
| `artifacts/client/` | Entire frontend. React + Vite, served at `/`. Product pages in `src/features/` (auth, dashboard, template-library, template-editor, case-file, intake, dimensions). |
| `artifacts/api-server/` | Entire backend. Express 5 at `/api`. Feature routers in `src/features/` mirroring the client. |
| `services/analyzer/` | Analyzer engine. Python FastAPI worker (port 8000). Talks to the portal **only through the public API** — pulls the packet over HTTP, POSTs one run object back. |
| `lib/db/` | Drizzle schema + client for Postgres. |
| `lib/api-spec/openapi.yaml` | **The API contract — single source of truth.** |
| `lib/api-zod/`, `lib/api-client-react/` | Generated. Never hand-edit. |
| `artifacts/mockup-sandbox/` | Historical record of approved design mockups. Not production code. |
| `docs/` | Product specs: `homium-product-spec.md` (handoff), `homium-template-schema-spec.md` (template JSON contract). |

The analyzer build spec (`attached_assets/homium-analyzer-spec-v0.6.3-FINAL_*.md`) governs the engine and supersedes all prior copies.

## How we build

- **Contract-first.** Change `openapi.yaml` → `pnpm --filter @workspace/api-spec run codegen` → implement. Server validates all IO with generated Zod; client uses generated React Query hooks.
- **Mirrored feature folders** client/server. ≤~250 lines per file. No utils dumping grounds.
- **Async, honest choreography.** Long work claims a state, kicks a worker, and the result lands later through a real endpoint. Failures surface via callbacks and error fields — never silent hangs, never fake success. Failed fetches render errors, never empty states.
- **Counts are always derived** from data, never hardcoded.
- **Modularity mandate:** small files, separation of concerns, no over-engineering.

## Design language — "Ops Desk"

- Workmanlike, dense, Excel-energy. Ground `#F3F5F7`, white surfaces with `#E2E8F0` borders, ink `#0F172A`, single accent blue `#1D4ED8`. Red `#DC2626` blockers, amber `#D97706` warnings, green sparingly (accepted/clear only).
- Inter everywhere; IBM Plex Mono for **data only** (numbers, dates, IDs, filenames, clocks). Radius ≤6px, borders not shadows, squared tags — pills are dead. No emojis.
- Doctrines: ops staff get dense sheets with inline expansion; contributors get one-thing-at-a-time forms (never tables). Header says only *whose file / where you can go / what needs doing next* — blockers first, one urgency surface. AI is assistive and quiet: suggests, human confirms, never auto-applies.

## Dev loop

- Workflows: `artifacts/client: web` (Vite, HMR), `artifacts/api-server: API Server` (esbuild → node, **no watch — restart after edits**), `Analyzer Worker` (uvicorn :8000, **no watch**; `curl 127.0.0.1:8000/health` reports backend problems honestly).
- From shell: API at `http://127.0.0.1:80/api/...`.
- `pnpm run typecheck` across all packages. After `lib/db` schema changes: `push` **and** `tsc -b` (composite project).
- Test assets: `test-assets/sample-packet-v1.pdf` (planted blank/dup/skew → gated), `sample-packet-v2.pdf` (harder stresses), `clean-sample-3p.pdf` (auto gate). All synthetic, regenerable, "SAMPLE"-marked.
- Pipeline driver: `node artifacts/api-server/scripts/run-packet.mjs <appId> <pdfPath> [--auto]`.
- Loan-document bytes never enter git history (spec-author directive): `data/packets|uploads/` and `services/analyzer/store/` are gitignored.

## Environments

- Prod: `loandocs.replit.app` (private). Postgres tables are created + seed-on-boot at first publish; App Storage bucket is **shared between dev and prod**.
- Verify prod data via SQL against the production database, not by hitting the URL.
