# CLAUDE.md — how this repo works and how Claude Code contributes

## What this is

**Sheaf** (platform brand; **Homium** is the client) — a compliance document manager for
home-loan packets. Originators upload large merged PDFs; the system splits, classifies,
names, files, freshness-checks, and fraud-scores them against a per-loan checklist
template. Deep field extraction is deliberately v2.

- **Spec authority:** `attached_assets/homium-analyzer-spec-v0.6.3-FINAL_1784868742753.md` —
  the ONLY analyzer spec. One spec authority at a time; superseded copies get deleted.
- **Internal docs:** `internal_docs/` — `_overview.md` (architecture), `_future.md`
  (parking lot: decided-but-deferred; don't relitigate, schedule), per-feature docs
  (`intake.md`, `templates.md`, `packet-pipeline.md`, `analyzer.md`, `persistence.md`, …),
  and `models/` (per-stage model tracking + dated engine comparisons).
- **`.agents/memory/`** — the Replit builder agent's own notes (accurate; read them,
  don't edit them).

## Environments and how code flows

1. **Replit workspace** — primary build + runtime. A Replit agent builds the app there;
   all workflows (API Server, web, Analyzer Worker) and all secrets live there. Prod
   deploys from Replit (invite-only). The **workspace dev server**
   (https://5c5c5d45-be54-4997-b8bc-818eaad36a15-00-ibpr96xgx796.janeway.replit.dev/)
   shows the most recent work — often ahead of prod AND of GitHub; check it when
   "latest" matters.
2. **GitHub** `jononovo/PropTech` — the sync point. Replit syncs to GitHub, but the agent
   sometimes commits without pushing, so **GitHub may be behind Replit. Never assume
   GitHub is current, and don't police pushing** (standing user instruction).

**Claude Code's contribution flow (non-negotiable):** get user approval → work on a
branch → open ONE PR → the **user** merges into GitHub → the **user** syncs Replit. Never
push to `main`; never merge your own PR. Changes to code the Replit agent owns
(`artifacts/`, `lib/`, `services/`) ship as a PR the user merges, or as a paste-block note
the user relays to the agent — coordinate, don't collide.

## Hard rules (violations are serious)

- **No fake anything.** Production tool in a testing phase: test *data* is synthetic, but
  every flow, scan, and analysis result must be real and 100% working. No mock modes, no
  simulated results, no stubbed pipeline output. When something can't run (missing key,
  missing worker) it must fail loudly — never fabricate.
- **No packet bytes in git**, ever (synthetic or not). Packet/upload bytes live in App
  Storage / gitignored dirs.
- **Keys never in chat or git.** Provider keys live in Replit secrets only.
- **The analyzer never touches the database.** Its only integration surface is
  `POST /api/applications/{id}/analysis`. Single-writer boundary — don't blur it.
- **Verdicts are human-only.** Every AI output is a suggestion with confidence; human
  override is absolute and always recorded.
- Templates: draft = editable, active = immutable (409). Applications pin a full
  template copy forever; re-pin is additive-only, upgrade-only, audited.

## Repo map (pnpm monorepo)

| Path | What |
|---|---|
| `lib/api-spec/openapi.yaml` | **Contract-first source of truth.** Edit FIRST, then `pnpm --filter ./lib/api-spec run codegen` (orval → `lib/api-zod` + `lib/api-client-react`, then lib typecheck). |
| `artifacts/api-server` | Express 5, feature folders (`src/features/*`). Validates with generated Zod. |
| `artifacts/client` | React + Vite, feature folders, ≤~250 lines/file (user mandate). Calls the API root-relative (`/api/...`) via the generated client. |
| `lib/db` | Drizzle + Postgres. Operational store: applications (one jsonb doc per row, row-locked `updateApplication` transactions), analysis_runs (append-only, unique `(application_id, run_id)`), templates / saved_sections / users (jsonb, seed-on-boot from committed fixtures in `artifacts/api-server/data/` when a table is empty). Packet/document bytes live in **App Storage** (GCS), not the DB or git. |
| `services/analyzer` | Python worker (FastAPI, :8000). Stage × backend modular (`config.py`, env-driven): parse / text / judge each pick a backend. Parse today = PaddleOCR-VL 1.6 via a Fireworks dedicated deployment through the paddleocr doc-parser pipeline; judge = Anthropic; text = GLM on Fireworks. Runs paddle in a subprocess per packet. |
| `scripts/`, `artifacts/api-server/scripts/` | Ops + dev drivers: `run-packet.mjs` (upload→gate→poll), `repin-template.ts`, `seed.ts`, `post-merge.sh` (runs on Replit after sync). |
| `test-assets/` | Synthetic packet generators (`make-sample-packet*.mjs`) — regenerable, "SAMPLE"-marked. |

## Working norms (user-enforced)

- Point-form, succinct. One consolidated note, never two.
- Research → options before changing course; never silently work around a wall.
- Verify at source; never agreeable-nod. Own errors plainly.
- Don't over-engineer; but cheap-and-foundational ≠ deferrable.
- Notes to the Replit agent go through the user as paste blocks.
