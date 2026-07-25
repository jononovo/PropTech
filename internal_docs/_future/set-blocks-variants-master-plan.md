# Set Blocks, Variants & Approved-Docs Storage — Master Plan v1.0 (Jul 25, 2026)

Supersedes the addendum draft (`attached_assets/set-blocks-satisfaction-spec-v0.1_*.md`) with the user's rulings:
variants are **generic** (bank accounts, persons, anything), declared **per-application** against a
template-declared shape; storage is **option B** (flat folder, paired same-basename `.pdf` + `.md`);
physical extraction happens **at approval only** — nothing enters the approved registry before a human accepts it.
Extends spec v0.7 FINAL. All changes additive; existing templates/applications untouched.

## Concept map
- **Set block** — a document block satisfiable by N *variants* instead of exactly one upload.
- **Variant** — one real-world instance of the requirement on a specific application
  (bank account "Chase ····1234", person "Jane Doe · 1990-04-24"). Identified by a **descriptor**:
  key/value pairs whose *keys* the template author defines (`institution`+`account_last4`, `name`+`dob`)
  and whose *values* the originator fills per deal. Display label = variant noun + joined descriptor values.
- **Docs per variant** — `single` (one birth certificate) or `sequence` (N statements, recency window,
  consecutive-months coverage). Rules are data, never code.
- **Approved document** — approval-time materialized PDF (page ranges extracted from the intact packet)
  + sibling `.md` with YAML front matter (scores, description, provenance). Originals immutable; `derivedFrom` links back.

## Phase 1 — Contract + builder (BUILD FIRST)
Template `Block` (document kind) gains three optional fields — absent = today's behavior:
- `arity?: "single" | "set"`
- `variantConfig?: { variantNoun: string; descriptorFields: {key, label}[]; docsPerVariant: { mode: "single"|"sequence"; requiredCount?; recencyWindowDays?; coverage?: "consecutive_months" } }`
- `analysisNote?: string` — author-written expert guidance, later fed to the satisfaction pass.

Files:
- `lib/api-spec/openapi.yaml` — `VariantConfig`, `DescriptorField`, `DocsPerVariant` component schemas; `Block` additions. Regenerate `lib/api-zod` (+ `tsc -b`).
- `artifacts/api-server/src/features/template-editor/validate.ts` — new invariants: `arity:"set"` ⇒ `variantConfig` present with ≥1 descriptorField, unique keys; `mode:"sequence"` ⇒ `requiredCount ≥ 1`; `variantConfig` without `arity:"set"` rejected.
- Client `features/template-editor/`: `BlockEditor.tsx` — "Accepts multiple variants" toggle → noun, descriptor-field rows (add/remove), docs-per-variant rules, analysis-note textarea. Mutations ride existing `UPDATE_BLOCK`/`BlockPatch` (extend patch type); NO new reducer actions. Block card shows a small "set" badge.
- Reducer tests: set-block patch round-trip + invariant cases in `templateReducer.test.ts` sibling or validate tests server-side.

## Phase 2 — Application variants + intake
- `Application` jsonb gains `variants?: {[blockId]: Variant[]}`; `Variant = { id, descriptor: {[key]: string}, label, createdAt }`. Upload entries gain optional `variantId`. Object-store keys UNCHANGED (variant lives in metadata, not paths — no storage moves).
- API (`features/case-file` or new `features/variants/` in api-server): `POST/DELETE /applications/{id}/blocks/{blockId}/variants` via the `updateApplication` tx helper. Validation: descriptor keys must match the template block's `descriptorFields`; duplicate descriptor value-sets rejected.
- Client `features/case-file/`: set blocks render variant cards (label + per-variant upload list + completeness "2 of 3"); add-variant form generated from `descriptorFields`. Upload actions carry `variantId`.

## Phase 3 — Approval materialization + approved store (option B)
- New api-server feature folder `features/approved-docs/`:
  - `approvedObjectStore.ts` — same storage backend, new prefix. Flat per app: `approved/<applicationId>/<basename>.pdf` + `.md`. Basename = `<blockSlug>_<variantSlug>_<date-or-period>[_<seq>]`, slugified descriptor values (user's example: `account_1234_j_d_smith_2024_04_24_B.pdf|.md`).
  - `extract.ts` — `extractPages(packetBytes, ranges): Buffer` via pdf-lib.
  - `frontmatter.ts` — builds the `.md`: YAML front matter (taxonomyId, scores, flags, description, pages, packet sha, `derivedFrom {sourceKey, pages, operation:"extract", actor, timestamp}`, approvedBy/At) + concatenated per-page markdown pulled from the run artifacts.
  - `router.ts` — approve endpoint; list/download approved docs.
- New table `approved_documents` (`lib/db/src/schema/approved-documents.ts`): `{ id, applicationId, blockId, variantId?, basename, data jsonb, approvedBy, approvedAt }`. Append-only; this is the registry — pre-approval splits/assignments stay in run data + intake flow and are never in it.
- Trigger: accept verdict on a block/variant. Never automatic during analysis.

## Phase 4 — Satisfaction pass (analyzer)
Per set block with ≥1 assigned doc: text-LLM over structured inputs only (rules + analysisNote + per-doc coreFields/scores/flags/pages). Write-once `satisfaction/block-<id>.json` + additive run-payload field; per-variant groups + gaps + one-paragraph summary; superseded (re-run per block) after human reassignment. Cost folded into existing run gate. Spec'd in detail when Phase 3 lands.

## Guard-rails
- No storage moves; no new storage abstraction — new prefixes on the existing module pattern only.
- All contract changes additive; old templates/apps parse unchanged.
- Descriptor identity is assistive — humans can always re-assign; overrides are audit rows.
- No conditional logic in rules — data-shaped constraints only (v1 restraint stands).
- Each phase ships alone; feature folders per concern, front and back.
