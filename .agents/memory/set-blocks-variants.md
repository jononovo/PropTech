---
name: Set blocks & variants
description: Rulings + phase status for the set-blocks/variants/approved-docs build (master plan in internal_docs/_future/set-blocks-variants-master-plan.md)
---

User rulings (Jul 25, 2026):
- Variants are GENERIC (accounts, persons, …) and declared PER-APPLICATION; the template only declares the shape (variant noun + descriptor field keys + docs-per-variant rules). Never bake accounts into templates.
- Storage (superseded Jul 25 2026 night): ONE self-contained folder per application — `applications/<appId>/{packet,uploads,approved}/` — so a whole case downloads in one click. Approved stays flat paired same-basename `.pdf` + `.md`. All keys minted only in packetObjectStore.ts; old prefixes migrated & deleted.
- Intake immutability RULING: originals are never edited/merged in place — audit trail (financial data). Merges/splits materialize only as new approved artifacts pointing back to sources. IP-address capture on upload not yet implemented (user mentioned wanting it).
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

Status: Phases 1 & 2 shipped & e2e-verified. Phase 1: Block.arity/variantConfig/analysisNote + builder editor. Phase 2 (Jul 25, 2026): separation rule in caseData (cleared/quiet/covered = accepted only; clean renders but never counts), ApplicationVariant CRUD (features/variants), upload tagging via `?variantId=` query param, VariantPanel in Workfile. Gotcha: generated-barrel name collisions (AddVariantBody etc.) resolved by explicit VALUE re-exports from generated/api in lib/api-zod/src/index.ts. Phase 3C shipped & e2e-verified (Jul 25, 2026): server = documentApprovals append-only trail + POST /applications/{id}/document-approvals (materializes via matchPages supersede) + uploaderIp capture; client = review/approval/ layer (docGroups.ts pure grouping w/ client-side merge links, useDocApproval hook, DocGroupsStrip grouped filmstrip w/ hover ✓/✕/⚑ + collapsed settled chips + show-all toggle, DocApprovalRail filing rail) wired into ReviewPage with Page|Document segmented control, doc-mode landing on first unsettled group, ↵ = approve document. Gotcha: hover-cluster buttons (group-hover CSS) invisible to Playwright hover — testers must click underlying control directly. Remaining: 3D (approved-registry read surface) → 4 (satisfaction pass) → 5 (multi-file intake).
