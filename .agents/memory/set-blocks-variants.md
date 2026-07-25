---
name: Set blocks & variants
description: Rulings + phase status for the set-blocks/variants/approved-docs build (master plan in internal_docs/_future/set-blocks-variants-master-plan.md)
---

User rulings (Jul 25, 2026):
- Variants are GENERIC (accounts, persons, …) and declared PER-APPLICATION; the template only declares the shape (variant noun + descriptor field keys + docs-per-variant rules). Never bake accounts into templates.
- Storage: option B — flat `approved/<appId>/` folder, paired same-basename `.pdf` + `.md` (YAML front matter with scores/desc/provenance). NO moving of existing storage.
- Physical extraction at APPROVAL ONLY; pre-approval splits stay in the intake/run flow, never in the approved registry.
- Cost of satisfaction pass: user said don't worry; fold into existing gate anyway.
- Docs-per-variant counts are GUIDANCE only ("typically N"), never a hard requirement — sequence means "one or more"; one doc never fails it. No recency field in variant rules — the block's existing expiry clock owns recency (a duplicate field was added and removed same day).

**Why:** these override the other agent's addendum draft (which assumed v0.6.3 and auto-discovery-only identity).
**How to apply:** follow the master plan phases; all contract changes additive; descriptor KEYS are mint-stable (rename labels, not keys).

Status: Phases 1 & 2 shipped & e2e-verified. Phase 1: Block.arity/variantConfig/analysisNote + builder editor. Phase 2 (Jul 25, 2026): separation rule in caseData (cleared/quiet/covered = accepted only; clean renders but never counts), ApplicationVariant CRUD (features/variants), upload tagging via `?variantId=` query param, VariantPanel in Workfile. Gotcha: generated-barrel name collisions (AddVariantBody etc.) resolved by explicit VALUE re-exports from generated/api in lib/api-zod/src/index.ts. Phases 3–4 pending.
