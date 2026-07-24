# Future — accepted but deferred

Parking lot for decisions that are made but deliberately not built yet. Don't relitigate; schedule.

## Attribution on edits (parked Jul 24, 2026)
- Verdicts record `decidedBy` from the signed-in test profile — that works today.
- **Closing-date edits (and other application field edits) are NOT attributed** — the application update path carries no `editedBy`, and edits don't appear in the case-file audit trail.
- When to build: with real auth, or earlier if audit pressure demands. Shape: additive — stamp application updates with the acting profile, surface them in the audit trail.

## Already-locked deferrals
- **Template version management screen — v2/v3.** View versions, diff, rollback-via-copy. v1 (shipped Jul 24, 2026) is repin-to-newer-active only: case-file header nudge + additive-only server enforcement + templateHistory audit entries. Rollback today = copy-old-into-new-draft-and-activate.
- **Email infrastructure — v3.** Until then, copy-applicant-link is the request mechanism.
- **Paddle 1.6 pipeline integration (APPROVED — immediate next engine task, spec v0.6.3 §1.1):** deployment EXISTS: `accounts/creditclaw/deployments/p4tlc3h1` (PaddleOCR-VL 1.6, Fireworks library deploy, scale-to-zero, auth = existing FIREWORKS_API_KEY). Console example confirms it's OpenAI-compatible chat-completions at `https://api.fireworks.ai/inference/v1` with `model=accounts/creditclaw/deployments/p4tlc3h1` — that base/model pair is what `vl_rec_server_url` wiring points at (the chat-completions form itself stays ruled out for parsing). Worker side: `paddlepaddle` ≥3.2.1 CPU build + `paddleocr[doc-parser]` ≥3.6.0, `pipeline_version="v1.6"`, `vl_rec_backend="vllm-server"`, `vl_rec_server_url=<deployment URL>` (PP-DocLayoutV3 runs locally in the worker) — NOT the bare chat-completions VLM (Baidu requires the full pipeline). Must then save per document: raw md, **elements JSON, region crops**, page renders, config+versions (crops/elements slots already exist in the run contract/store — nothing assumes their absence). Acceptance per spec author (Jul 24, 2026): run the sample packet through interim (Claude) and Paddle parsers — same packet — for a real before/after on quality; during first tests confirm the deployment actually scales back to zero after idle (billing assumption). No interim change: parse+judge stay on Claude until this work starts. Self-hosted vLLM Docker is break-glass fallback ONLY.
- **Region highlighting on page images — v2.**
- **Filmstrip review room (direction A)** — after the case file + engine land.
- **Real authentication** — replaces the 4-profile test sign-in; schema already auth-shaped. Never Clerk.
- **Run history UI** — none. Latest run wins on every screen; older runs stay on disk in the sidecar for audit (user confirmed Jul 24, 2026).
