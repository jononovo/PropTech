---
name: Set blocks & variants
description: Rulings + phase status for the set-blocks/variants/approved-docs build (master plan in internal_docs/_future/set-blocks-variants-master-plan.md)
---

User rulings (Jul 25, 2026):
- Variants are GENERIC (accounts, persons, …) and declared PER-APPLICATION; the template only declares the shape (variant noun + descriptor field keys + docs-per-variant rules). Never bake accounts into templates.
- Storage: option B — flat `approved/<appId>/` folder, paired same-basename `.pdf` + `.md` (YAML front matter with scores/desc/provenance). NO moving of existing storage.
- Physical extraction at APPROVAL ONLY; pre-approval splits stay in the intake/run flow, never in the approved registry.
- Phase 3 SHIPPED Jul 25 2026: append-only approved_documents registry, one materialization seam, flat approved/<appId>/ store, loud materializationErrors + retry; worker now serves per-page md over HTTP. Set blocks 409 at block-level accept until per-document flow exists.
- Cost of satisfaction pass: user said don't worry; fold into existing gate anyway.
- Docs-per-variant counts are GUIDANCE only ("typically N"), never a hard requirement — sequence means "one or more"; one doc never fails it. No recency field in variant rules — the block's existing expiry clock owns recency (a duplicate field was added and removed same day).

Rulings (Jul 25, 2026, evening):
- Approval unit = DOCUMENT (e.g. one 3-page statement inside a merged PDF), tagged to block+variant; page decisions are a pre-step, roll-up prompt confirms; partial approval allowed but marked incomplete. Full flow needs canvas mockups — see internal_docs/_future/document-approval-flow.md. Phase 3 machinery must expose ONE materialization function both block-accept (singles) and the future per-document flow call.
- Re-acceptance: supersede old approved rows (keep + link), never delete/refuse.
- Materialization failure: verdict stands, registry row missing, loud error with reason + retry.
- Variant shapes should become savable/preset library later (internal_docs/_future/variant-shape-library.md); single-variant set blocks are legitimate (shape = naming convention).
- Packet ≠ one PDF long-term: multi-file intake manifest with per-file X (internal_docs/_future/multi-file-intake.md); v1 deliberately minimal.

Rulings (Jul 25, 2026, night — Phase 3C direction):
- Chosen mockup: Approval A "Filmstrip Groups" (canvas, mockups/doc-approval/FilmstripGroups.tsx).
- REUSE mandate: 3C extends existing ReviewPage/filmstrip/viewer components via overlay props; new components only for genuinely-new behavior (roll-up prompt, merge/link, grouping), mounted conditionally; no new page, no forked components, no giant page files.
- Pending user ruling: merge-in-approved-copy-only vs permanent merge in intake (agent default: approved copy only).

**Why:** these override the other agent's addendum draft (which assumed v0.6.3 and auto-discovery-only identity).
**How to apply:** follow the master plan phases; all contract changes additive; descriptor KEYS are mint-stable (rename labels, not keys).

Status: Phases 1 & 2 shipped & e2e-verified. Phase 1: Block.arity/variantConfig/analysisNote + builder editor. Phase 2 (Jul 25, 2026): separation rule in caseData (cleared/quiet/covered = accepted only; clean renders but never counts), ApplicationVariant CRUD (features/variants), upload tagging via `?variantId=` query param, VariantPanel in Workfile. Gotcha: generated-barrel name collisions (AddVariantBody etc.) resolved by explicit VALUE re-exports from generated/api in lib/api-zod/src/index.ts. Phases 3–4 pending.
