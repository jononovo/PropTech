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
- Packet upload/gate serialize through an in-process per-application lock that is HELD ACROSS run ingest. Fine while ingest is the fast simulated self-POST; when the real engine arrives (long runs), move ingest out of the lock (job + poll) or uploads will block for minutes.
