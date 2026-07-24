# Sheaf

Document-ops platform for lending compliance: define document templates, collect applicant documents, and (in later phases) split/classify/score 300-page loan packets with AI + human verdicts. **Sheaf is the product brand; Homium is the client** whose deposit-assistance program runs inside it — no Homium branding in the app shell. The analyzer's source of truth is the analyzer build spec at `attached_assets/homium-analyzer-spec-v0.6.3-FINAL_1784868742753.md` (supersedes ALL prior spec versions — older copies are deleted; defers to the portal docs wherever they overlap).

## Architecture map — READ THIS FIRST

| Folder | Role |
| --- | --- |
| `artifacts/client/` | **The entire frontend** (React + Vite). All product pages live in `src/features/`. Served at `/`. |
| `artifacts/api-server/` | **The entire backend** (Express 5). Platform-fixed name — this is the "server" folder. Serves `/api`. Feature routers in `src/features/`; templates + packet/upload files in `data/`, operational data in Postgres. |
| `services/analyzer/` | **The analyzer engine** (Python FastAPI worker, port 8000). Parse → split/classify → judge → scrutiny → ONE run POSTed to the portal's ingest endpoint. Talks to the portal only through the public API; run artifacts under its `store/`. |
| `lib/db/` | Drizzle schema + client for the Postgres operational store (`applications`, `analysis_runs`). After schema changes: `pnpm --filter @workspace/db run push` AND `pnpm --filter @workspace/db exec tsc -b` (composite project — stale `dist/` d.ts otherwise). |
| `lib/api-spec/openapi.yaml` | **The API contract** — single source of truth. Change it first, then run codegen. |
| `lib/api-zod/`, `lib/api-client-react/` | Generated from the spec (Zod schemas for the server, React Query hooks for the client). Never hand-edit. |
| `artifacts/mockup-sandbox/` | Design mockups only — historical record of the approved designs. NOT production code. |
| `docs/` | Product specs. `homium-product-spec.md` is the full handoff spec; `homium-template-schema-spec.md` defines the template JSON contract. |
| `internal_docs/` | Working build docs: `_overview.md` (architecture + feature index), one MD per feature, `_future.md` (deferred-work parking lot). **Keep in sync when features change.** |

## Run & Operate

- Workflows: `artifacts/client: web`, `artifacts/api-server: API Server`, `Analyzer Worker` (uvicorn :8000; `curl 127.0.0.1:8000/health` reports backend problems honestly)
- No file-watch on the API server or the worker — restart the workflow after edits
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas after any spec change

## Architecture decisions

- **Persistence is Postgres-first (Jul 2026 migrations, user-approved):** applications (one jsonb document per row), analysis runs (append-only rows, unique `(application_id, run_id)` = replay protection), templates, saved sections, and demo users all live in **Postgres** via `lib/db`. Committed JSON fixtures under `artifacts/api-server/data/` seed empty tables at boot (dev and prod). **Document bytes live in App Storage** (Jul 2026): packet PDFs, page thumbnails, and intake uploads under `PRIVATE_OBJECT_DIR` (`packets/<appId>/…`, `uploads/<appId>/<blockId>/…`) — `lib/packetObjectStore.ts` is the only module that knows the layout; serving URLs unchanged (analyzer still pulls over HTTP). Legacy `data/packets|uploads/` dirs are a backfilled backup only, still gitignored along with `services/analyzer/store/`: loan-document bytes never enter git history (spec-author directive, Jul 2026). Analyzer's own working store stays local by design (engine workspace, re-fetches bytes per run).
- All application mutations go through `updateApplication(id, mutate)` — a `SELECT ... FOR UPDATE` transaction (`mutate` throws `HttpError` to abort). Packet gate/state transitions are therefore atomic across instances; the in-process packet lock only serializes per-app disk-file work.
- **Contract-first:** OpenAPI spec → codegen → implementation. Server validates all IO with generated Zod schemas.
- **Packet choreography is asynchronous and honest (Jul 2026):** upload/gate claims `processing` and kicks the worker (expects 202); the run lands later through the ingest endpoint, which flips state to `report`. Any worker failure calls the run-failed callback → revert to `gated` + `lastRunError` — never a silent hang. Analyzer models are env-driven (`PARSE_*`/`JUDGE_*`/`TEXT_*`) and labeled in `pipelineVersion`; current spec config = PaddleOCR-VL 1.6 parse (Fireworks deployment, scale-to-zero) + GLM text + Claude judge on the user's own Anthropic key (account-linked secret); all-Claude interim is one env flip away. Deferred work: `internal_docs/_future.md`.
- Template lifecycle: draft = editable, active = immutable (409); new version copies vN → v(N+1) draft; applications pin a full template copy forever; saved sections are copies, never links.
- Mirrored feature folders client/server; ≤~250 lines per file; no utils dumping grounds (user mandate).
- Demo auth only (v1): seeded `users` table (all passwords "1234", plaintext by design), `GET /users` + `POST /login`, login page pre-fills credentials on click. No sessions/tokens — signed-in user lives in localStorage; nothing enforced server-side. Real auth replaces this edge later.

## User preferences

- Folder names must read as standard client/server architecture; frontend folder is `client` (renamed from `portal` at user's request, Jul 2026). Any new top-level piece needs an obvious architectural name.
- Brand: app is "Sheaf" only — never put the client name (Homium) in titles, chrome, or logos.
- Serious production mindset: no mockup shortcuts in app code; terse professional communication.
