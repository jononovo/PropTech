#!/usr/bin/env bash
# Production launcher for the api-server deployment container.
#
# In production only this one command runs — the "Analyzer Worker" dev
# workflow does not exist there. So we start the analyzer worker (uvicorn
# on :8000) in the background alongside the Node API server, matching the
# dev topology (ANALYZER_URL=http://127.0.0.1:8000).
#
# PORTAL_API_BASE: in dev the worker calls back through the port-80 proxy;
# in the prod container there is no proxy, so point callbacks straight at
# the Node server on :8080.
set -uo pipefail
cd "$(dirname "$0")/.."

export PORTAL_API_BASE="${PORTAL_API_BASE:-http://127.0.0.1:8080/api}"

bash services/analyzer/run.sh &

exec node --enable-source-maps artifacts/api-server/dist/index.mjs
