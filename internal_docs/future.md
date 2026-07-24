# Future — accepted but deferred

Parking lot for decisions that are made but deliberately not built yet. Don't relitigate; schedule.

## Attribution on edits (parked Jul 24, 2026)
- Verdicts record `decidedBy` from the signed-in test profile — that works today.
- **Closing-date edits (and other application field edits) are NOT attributed** — the application update path carries no `editedBy`, and edits don't appear in the case-file audit trail.
- When to build: with real auth, or earlier if audit pressure demands. Shape: additive — stamp application updates with the acting profile, surface them in the audit trail.

## Already-locked deferrals
- **Email infrastructure — v3.** Until then, copy-applicant-link is the request mechanism.
- **Paddle 1.6 pipeline integration (APPROVED — immediate next engine task, spec v0.6.3 §1.1):** product owner one-click-deploys PaddleOCR-VL 1.6 from Fireworks' library (scale-to-zero-window 5–10 min, smallest GPU shape) → OpenAI-compatible URL. Worker side: `paddlepaddle` ≥3.2.1 CPU build + `paddleocr[doc-parser]` ≥3.6.0, `pipeline_version="v1.6"`, `vl_rec_backend="vllm-server"`, `vl_rec_server_url=<deployment URL>` — NOT the bare chat-completions VLM (Baidu requires the full PP-DocLayoutV3 pipeline). Must then save per document: raw md, **elements JSON, region crops**, page renders, config+versions (crops/elements slots already exist in the run contract/store — nothing assumes their absence). Self-hosted vLLM Docker is break-glass fallback ONLY.
- **Region highlighting on page images — v2.**
- **Filmstrip review room (direction A)** — after the case file + engine land.
- **Real authentication** — replaces the 4-profile test sign-in; schema already auth-shaped. Never Clerk.
- **Run history UI** — none. Latest run wins on every screen; older runs stay on disk in the sidecar for audit (user confirmed Jul 24, 2026).
