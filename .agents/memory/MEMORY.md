# Memory Index

- [File-native intake](file-native-intake.md) — RULING Jul 26: no concatenation ever; files stay as dropped; spec at internal_docs/_future/file-native-intake.md; retires packet-as-one-PDF.

- [Sheaf design direction](homium-design-direction.md) — brand=Sheaf (Homium=client); Ops Desk design family; analyzer spec v0.7 FINAL governs the engine.
- [User interaction](user-interaction.md) — prefers questions as plain chat text, not AskQuestion forms; answers may arrive as revised spec docs from a parallel thread.
- [Sheaf dev loop](sheaf-dev-loop.md) — NO server watch (restart workflow); Postgres op-store rules (updateApplication tx only); lib/db needs tsc -b after schema changes; packet test assets + probe gotchas.
- [Model plans](model-selection-plans.md) — worker registry is truth; loud-failure resolution; auto-proceed suspended; ruled: Mistral default parse, auto-proceed back after burn-in.
- [Model backends](model-backends.md) — Fireworks key = 6 text models only; paddle-1-6 needs user-made on-demand deployment; judge needs Anthropic/etc; org AI integrations disabled.
- [Set blocks & variants](set-blocks-variants.md) — ALL phases (1–5 incl. satisfaction pass + multi-file intake) shipped & e2e-verified Jul 26 2026; rulings: per-app variants, flat approved storage, approval-only extraction.
- [Nix GCC runtime](nix-gcc-runtime.md) — manylinux wheels need libgomp/libstdc++ via runtime store discovery; old gcc dirs poison Nix binaries (GLIBCXX).
