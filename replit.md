# Sheaf

Document-ops platform for lending compliance: define document templates, collect applicant documents, and (in later phases) split/classify/score 300-page loan packets with AI + human verdicts. **Sheaf is the product brand; Homium is the client** whose deposit-assistance program runs inside it — no Homium branding in the app shell. The analyzer's source of truth is the analyzer build spec at `attached_assets/homium-analyzer-spec-v0.6.2_1784857283923.md` (supersedes all prior IDCM spec versions; defers to the portal docs wherever they overlap).

## Architecture map — READ THIS FIRST

| Folder | Role |
| --- | --- |
| `artifacts/client/` | **The entire frontend** (React + Vite). All product pages live in `src/features/`. Served at `/`. |
| `artifacts/api-server/` | **The entire backend** (Express 5). Platform-fixed name — this is the "server" folder. Serves `/api`. Feature routers in `src/features/`, data on disk in `data/`. |
| `lib/api-spec/openapi.yaml` | **The API contract** — single source of truth. Change it first, then run codegen. |
| `lib/api-zod/`, `lib/api-client-react/` | Generated from the spec (Zod schemas for the server, React Query hooks for the client). Never hand-edit. |
| `artifacts/mockup-sandbox/` | Design mockups only — historical record of the approved designs. NOT production code. |
| `docs/` | Product specs. `homium-product-spec.md` is the full handoff spec; `homium-template-schema-spec.md` defines the template JSON contract. |

## Run & Operate

- Workflows (managed): `artifacts/client: web`, `artifacts/api-server: API Server`
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas after any spec change

## Architecture decisions

- **Persistence is JSON files on disk** (`artifacts/api-server/data/`), no database — explicit user choice. Atomic temp-file writes; indexes always derived by directory scan.
- **Contract-first:** OpenAPI spec → codegen → implementation. Server validates all IO with generated Zod schemas.
- Template lifecycle: draft = editable, active = immutable (409); new version copies vN → v(N+1) draft; applications pin a full template copy forever; saved sections are copies, never links.
- Mirrored feature folders client/server; ≤~250 lines per file; no utils dumping grounds (user mandate).
- No auth in v1 — role simulated by a client-side switcher, not enforced server-side.

## User preferences

- Folder names must read as standard client/server architecture; frontend folder is `client` (renamed from `portal` at user's request, Jul 2026). Any new top-level piece needs an obvious architectural name.
- Brand: app is "Sheaf" only — never put the client name (Homium) in titles, chrome, or logos.
- Serious production mindset: no mockup shortcuts in app code; terse professional communication.
