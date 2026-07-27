---
name: Production deployment topology
description: How the analyzer worker runs in the published app and the prod-vs-dev URL differences
---

Production (loandocs.replit.app, cloudrun/autoscale) runs ONLY the api-server artifact's production run command — dev workflows (Analyzer Worker) do not exist there.

**Rule:** the api-server production run is `bash scripts/production-start.sh`, which launches the analyzer worker (uvicorn :8000) in the background then execs the Node server. If the worker isn't started there, `/api/models/options` 502s ("Model options unavailable — analyzer worker isn't reachable").

**Prod URL differences:**
- `ANALYZER_URL=http://127.0.0.1:8000` (userenv.shared, same both envs).
- `PORTAL_API_BASE` defaults to `http://127.0.0.1:80/api` — valid in dev (port-80 proxy) but NOT in prod (no proxy); the start script exports `http://127.0.0.1:8080/api`.

**Why:** deployment config lives in each artifact's `.replit-artifact/artifact.toml` (`[services.production.run]`), edited only via the temp-file `verifyAndReplaceArtifactToml` flow; `.replit`'s deployment.run is ignored in pnpm workspaces.

**Caveat:** autoscale may reap an idle instance mid-analysis-run (RUN_TIMEOUT_S=1800); if long runs die in prod, consider a VM (always-on) deployment.
