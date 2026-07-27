# Memory Index

- [Incremental runs](incremental-runs.md) — delta runs union into latest run blob at ingest ("latest run = whole truth"); worker store & page URLs are file-keyed; merge keys have no runId.

- [File-native intake](file-native-intake.md) — ALL phases shipped + tester-verified Jul 26; FileSpan everywhere; gated is IMPLICIT (run null until first decision); old packet fixtures deleted.

- [Sheaf design direction](homium-design-direction.md) — brand=Sheaf (Homium=client); Ops Desk design family; analyzer spec v0.7 FINAL governs the engine.
- [User interaction](user-interaction.md) — prefers questions as plain chat text, not AskQuestion forms; answers may arrive as revised spec docs from a parallel thread.
- [Sheaf dev loop](sheaf-dev-loop.md) — NO server watch (restart workflow); Postgres op-store rules (updateApplication tx only); lib/db needs tsc -b after schema changes; packet test assets + probe gotchas.
- [Model plans](model-selection-plans.md) — worker registry is truth; loud-failure resolution; Mistral default parse; auto-proceed WITHDRAWN permanently Jul 26 (owner likes the gate).
- [Access & retention](access-retention.md) — access matrix enforced on every /api call (x-profile identity); 2-yr retention sweep; Manager keeps upload (deviation); worker callbacks exempt.
- [Model backends](model-backends.md) — Fireworks key = 6 text models only; paddle-1-6 needs user-made on-demand deployment; judge needs Anthropic/etc; org AI integrations disabled.
- [Set blocks & variants](set-blocks-variants.md) — ALL phases (1–5 incl. satisfaction pass + multi-file intake) shipped & e2e-verified Jul 26 2026; rulings: per-app variants, flat approved storage, approval-only extraction.
- [Prod deployment](prod-deployment.md) — prod runs only api-server's run cmd; production-start.sh must launch analyzer worker + set PORTAL_API_BASE to :8080 (no port-80 proxy in prod).
- [Nix GCC runtime](nix-gcc-runtime.md) — manylinux wheels need libgomp/libstdc++ via runtime store discovery; old gcc dirs poison Nix binaries (GLIBCXX).
