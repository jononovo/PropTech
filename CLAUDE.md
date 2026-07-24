# CLAUDE.md — how this repo works and how Claude Code contributes

## What this is

**Sheaf** (platform brand; **Homium** is the client) — a compliance document manager for
home-loan packets. Originators upload large merged PDFs; the system splits, classifies,
names, files, freshness-checks, and fraud-scores them against a per-loan checklist
template. Deep field extraction is deliberately v2.

- **Spec authority:** `attached_assets/homium-analyzer-spec-v0.6.3-FINAL.md` — the ONLY
  spec. One spec authority at a time; superseded copies get deleted, never kept around.
- **Parking lot:** `internal_docs/future.md` — decisions made but deferred. Don't
  relitigate; schedule.
- **`.agents/memory/`** — the Replit builder agent's own notes (accurate; read them,
  don't edit them).

## The three environments and how code flows

1. **Replit workspace** (primary build + runtime). A Replit agent builds the app there;
   all workflows (API Server, web, Analyzer Worker) and all secrets live there. Prod
   deploys from Replit: prop-tech-loan-docs-analysis.replit.app (invite-only).
2. **GitHub** `jononovo/PropTech` (sync point). Replit syncs to GitHub — but the agent
   sometimes commits without pushing, so **GitHub may be behind Replit. Never assume
   GitHub is current, and don't police pushing** (standing user instruction).
3. **Local (this machine)** — Claude Code's mirror for review and contributions.

**Claude Code's change flow (non-negotiable):** get user approval on the change → build
it on a branch → open a PR → the **user** merges into GitHub → the **user** syncs Replit.
Never push to `main`. Never merge your own PR. Anything touching code the Replit agent
owns (`artifacts/`, `lib/`, `services/`) is coordinated through the user first — usually
as a paste-block note the user relays to the agent.

## Hard rules (violations are serious)

- **No fake anything.** This is a production tool in a testing phase: test *data* is
  synthetic, but every flow, scan, and analysis result must be real and 100% working.
  No mock modes, no simulated results, no stubbed pipeline output. When something can't
  run (missing key, missing worker), it must fail loudly — never fabricate.
- **No packet bytes in git**, ever (synthetic or not). `data/packets`, `data/uploads`,
  `services/analyzer/store/` are gitignored for this reason.
- **Keys never in chat or git.** Provider keys (`FIREWORKS_API_KEY`,
  `ANTHROPIC_API_KEY`) live in Replit secrets only.
- **The analyzer never touches the database.** Its only integration surface is
  `POST /api/applications/{id}/analysis`. Single-writer boundary — don't blur it.
- **Verdicts are human-only.** Every AI output is a suggestion with confidence; human
  override is absolute and always recorded.
- Templates: draft = editable, active = immutable (409). Applications pin a full
  template copy forever; re-pin is additive-only, upgrade-only, audited.

## Repo map (pnpm monorepo)

| Path | What |
|---|---|
| `lib/api-spec/openapi.yaml` | **Contract-first source of truth.** Edit this FIRST, then `pnpm --filter ./lib/api-spec run codegen` (orval → `lib/api-zod` + `lib/api-client-react`, then lib typecheck). |
| `artifacts/api-server` | Express 5, feature folders (`src/features/*`). Validates with generated Zod. |
| `artifacts/client` | React + Vite, feature folders, ≤~250 lines/file (user mandate). Calls the API root-relative (`/api/...`) via the generated client. |
| `lib/db` | Drizzle + Postgres. Operational store: applications (one jsonb doc per row, row-locked `updateApplication` transactions), analysis_runs (append-only, unique `(application_id, run_id)`), templates / saved_sections / users (jsonb, **seed-on-boot from committed fixtures** in `artifacts/api-server/data/` when a table is empty). |
| `services/analyzer` | Python worker (FastAPI, port 8000). Parse = PaddleOCR-VL 1.6 via Fireworks dedicated deployment driven through the paddleocr doc-parser pipeline; judge = Anthropic; text passes = GLM on Fireworks serverless. Runs Paddle in a subprocess per packet. |
| `scripts/` | Ops + dev tooling (`dev-proxy.mjs` for local; `post-merge.sh` runs on Replit after sync). |
| `artifacts/api-server/scripts/` | Durable drivers: `run-packet.mjs` (upload→gate→poll), `repin-template.ts`, `seed.ts`. |
| `test-assets/` | Synthetic packet generators (`make-sample-packet*.mjs`) — regenerable, "SAMPLE"-marked. |
| `internal_docs/` | future.md, parse-comparison writeups, review notes. |

## Local dev setup (verified working Jul 24, 2026 on macOS)

Prereqs: Node 24, pnpm 9 (`corepack enable pnpm`), Postgres running locally
(Homebrew 16/17 both fine), repo cloned.

```bash
pnpm install
createdb sheaf_dev
DATABASE_URL=postgres://localhost:5432/sheaf_dev pnpm --filter @workspace/db run push
pnpm run typecheck:libs        # builds composite lib d.ts (api-server needs them)

# Terminal 1 — API server (port 3001). Seeds templates/users/saved-sections from
# committed fixtures on first boot against an empty DB — same data Replit seeds.
cd artifacts/api-server
PORT=3001 DATABASE_URL=postgres://localhost:5432/sheaf_dev NODE_ENV=development pnpm run dev

# Terminal 2 — client (Vite, port 5173)
cd artifacts/client && PORT=5173 BASE_PATH=/ pnpm run dev

# Terminal 3 — one origin at http://localhost:3000 (mirrors Replit's shared /api proxy)
node scripts/dev-proxy.mjs
```

Open **http://localhost:3000** → login page with prefilled demo credentials (seeded
users; 4-profile test auth — real auth is deferred, never Clerk).

Gotchas (learned the hard way — see `.agents/memory/sheaf-dev-loop.md`):
- **api-server has NO file watching** (`dev` = esbuild build → node dist). After any
  edit under `artifacts/api-server/src/`, kill it, rerun `pnpm run dev`, or you will
  test stale code. The client is Vite HMR — no restart needed.
- After `lib/db` schema changes: `pnpm --filter @workspace/db run push` AND
  `pnpm --filter @workspace/db exec tsc -b` (stale `dist/*.d.ts` ⇒ phantom TS2305).
- API from shell: `curl http://localhost:3000/api/...` (or :3001 directly).
- Drizzle push needs `DATABASE_URL` in env; the server needs `PORT`, vite needs
  `PORT` + `BASE_PATH=/` locally.

### What does NOT run locally (and must not be faked)

The **analyzer worker** needs Python 3.12 + uv + Paddle deps, plus provider keys that
exist only in Replit secrets. Without it, uploading a packet still pre-flights and
gates, but a Process run fails visibly — that is correct behavior, not something to
work around with mocks. Full-pipeline tests (parse/judge/scrutiny) run on Replit.
Analyzer env on Replit (`.replit [userenv.shared]`): `ANALYZER_URL`, `PARSE_BACKEND=paddle`,
`PADDLE_VL_URL/MODEL` (Fireworks dedicated deployment `accounts/creditclaw/deployments/p4tlc3h1`,
scale-to-zero ~10 min — an idle H100 is the cost incident we already had once),
`TEXT_BACKEND=fireworks` (GLM), judge on Anthropic `claude-sonnet-4-6`.

## Browser testing

The user has the **Claude in Chrome extension**; when it's connected to a session its
browser tools appear as MCP tools — use them to click through the app at
`http://localhost:3000` (login → dashboard → case file → template library). If the
tools aren't present in the session, say so and fall back to curl-level verification;
ask the user to connect the extension rather than pretending to have seen the UI.

## Working norms (user-enforced)

- Point-form, succinct. One consolidated note, never two.
- Research → options before changing course; never silently work around a wall.
- Verify at source; never agreeable-nod. Own errors plainly.
- Don't over-engineer; but cheap-and-foundational ≠ deferrable (docType and the
  closing-date field were built early for exactly this reason).
- Notes to the Replit agent go through the user as paste blocks.
