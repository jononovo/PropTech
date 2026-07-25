---
name: Set blocks & variants
description: Rulings + phase status for the set-blocks/variants/approved-docs build (master plan in internal_docs/_future/set-blocks-variants-master-plan.md)
---

User rulings (Jul 25, 2026):
- Variants are GENERIC (accounts, persons, …) and declared PER-APPLICATION; the template only declares the shape (variant noun + descriptor field keys + docs-per-variant rules). Never bake accounts into templates.
- Storage: option B — flat `approved/<appId>/` folder, paired same-basename `.pdf` + `.md` (YAML front matter with scores/desc/provenance). NO moving of existing storage.
- Physical extraction at APPROVAL ONLY; pre-approval splits stay in the intake/run flow, never in the approved registry.
- Cost of satisfaction pass: user said don't worry; fold into existing gate anyway.

**Why:** these override the other agent's addendum draft (which assumed v0.6.3 and auto-discovery-only identity).
**How to apply:** follow the master plan phases; all contract changes additive; descriptor KEYS are mint-stable (rename labels, not keys).

Status: Phase 1 shipped & e2e-verified (Block.arity/variantConfig/analysisNote in openapi + validate.ts invariants + VariantConfigEditor.tsx in builder). Phases 2–4 pending.
