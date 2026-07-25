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
- `variantConfig?: { variantNoun: string; descriptorFields: {key, label}[]; docsPerVariant: { mode: "single"|"sequence"; expectedCount?; coverage?: "consecutive_months" } }`
  — sequence = "one or more"; `expectedCount` is a recommended amount, NEVER a gate (one document never fails a sequence);
  recency is governed by the block's existing expiry clock, deliberately not duplicated in variant rules (user ruling, Jul 25, 2026).
- `analysisNote?: string` — author-written expert guidance, later fed to the satisfaction pass.

Files:
- `lib/api-spec/openapi.yaml` — `VariantConfig`, `DescriptorField`, `DocsPerVariant` component schemas; `Block` additions. Regenerate `lib/api-zod` (+ `tsc -b`).
- `artifacts/api-server/src/features/template-editor/validate.ts` — new invariants: `arity:"set"` ⇒ `variantConfig` present with ≥1 descriptorField, unique keys; `mode:"sequence"` ⇒ `requiredCount ≥ 1`; `variantConfig` without `arity:"set"` rejected.
- Client `features/template-editor/`: `BlockEditor.tsx` — "Accepts multiple variants" toggle → noun, descriptor-field rows (add/remove), docs-per-variant rules, analysis-note textarea. Mutations ride existing `UPDATE_BLOCK`/`BlockPatch` (extend patch type); NO new reducer actions. Block card shows a small "set" badge.
- Reducer tests: set-block patch round-trip + invariant cases in `templateReducer.test.ts` sibling or validate tests server-side.

## Phase 2 — Application variants + intake separation — SHIPPED Jul 25, 2026
Built as specified below; e2e-verified (API curl suite + browser tester "variant-panel-ui-test",
verdict success: variant CRUD, dup 409, tagged upload, guarded delete, and rail/section counts
unmoved by intake-side activity). One deviation: upload's `variantId` travels as a query param
(`?variantId=`), not a multipart field — multer body ordering made the query param the safe spot.
Codegen note: `AddVariantBody`/`UploadDocumentParams` collide across the two generated barrels;
`lib/api-zod/src/index.ts` re-exports the zod VALUES from `generated/api` explicitly.

### 2a. Separation rule — intake vs application (user ruling)
A document is NOT part of the application until a human accepts it. Analyzed-but-unaccepted
documents belong to the intake/triage/review workflow; the application's completeness must never
count them. Today's leak: `caseData.ts` counts `clean` (analyzer-filed, no flags, no verdict) and
`covered` (alternative merely *present*) as cleared — the "looked done yesterday, rejected today" bug.
- `artifacts/client/src/features/case-file/caseData.ts`:
  - `cleared` / `done` / `quiet` count `accepted` and `covered` ONLY; `clean` is pending, full stop.
  - `covered` now requires the covering alternative to be **accepted**, not merely present
    (`present()` → accepted-verdict check). Pre-acceptance substitution stays visible as the
    informational `satisfied_by_alternative` flag on the substituting doc.
- Status vocabulary unchanged — `clean` still renders ("analyzer filed, awaiting human review");
  it just stops counting toward done.

### 2b. Variants on the application
- Contract (`lib/api-spec/openapi.yaml`, additive):
  - `ApplicationVariant = { id, descriptor: {[key]: string}, label, createdAt }`;
    `Application.variants?: {[blockId]: ApplicationVariant[]}`.
  - `UploadedFile.variantId?: string` — variant lives in METADATA; object-store keys unchanged.
  - Paths: `POST /applications/{id}/blocks/{blockId}/variants` (body: `{descriptor}`),
    `DELETE /applications/{id}/blocks/{blockId}/variants/{variantId}`.
- Server — new feature folder `artifacts/api-server/src/features/variants/router.ts`:
  - Create: block must exist with `arity:"set"`; descriptor keys must equal the template's
    `descriptorFields` keys exactly; values non-empty; duplicate value-sets rejected (409).
    `label` built server-side (descriptor values joined " · "); id minted once (nanoid).
  - Delete: refused (409) while uploads are tagged to the variant — untag/delete uploads first;
    loud failure, no silent orphans. All writes via the `updateApplication` tx helper.
- Server — `features/intake-uploads/router.ts`: upload accepts optional `variantId` (must exist on
  that block, 400 otherwise); stored on the UploadedFile record; delete-upload untouched.
- Client — `features/case-file/`:
  - `caseData.ts`: `CaseReq.variants?: { variant, uploads }[]` (uploads grouped by `variantId`;
    untagged uploads stay block-level).
  - `useCaseFile.ts`: `addVariant`, `deleteVariant`, upload mutation gains `variantId`.
  - `components/VariantPanel.tsx` (new): per set block — variant rows (label · upload count ·
    "typically N" guidance chip, never a gate), add-variant form generated from `descriptorFields`,
    per-variant upload button, delete (×) with loud error toast when refused.
  - `WorkfilePage.tsx` renders the panel for `arity:"set"` blocks.

## Phase 3 — Approval materialization + approved store (option B) — SHIPPED Jul 25, 2026

Shipped: `approved_documents` table (append-only, supersede-not-delete), `features/approved-docs/` (registry/frontmatter/materialize/router), ONE materialization seam (`materializeApproval`) called by single-block accept now and the future per-document flow later. Flat `approved/<appId>/<basename>.pdf+.md` in App Storage; extract mode (pdf-lib pages from packet + worker per-page md via new `/store/{app}/{run}/md/{page}`) and copy mode (direct PDF upload). Failures loud: `Application.materializationErrors[blockId]` + retry endpoint + red bar w/ Retry on accepted ReqCard. Set blocks 409 at block level (await per-document flow).
- New api-server feature folder `features/approved-docs/`:
  - `approvedObjectStore.ts` — same storage backend, new prefix. Flat per app: `approved/<applicationId>/<basename>.pdf` + `.md`. Basename = `<blockSlug>_<variantSlug>_<date-or-period>[_<seq>]`, slugified descriptor values (user's example: `account_1234_j_d_smith_2024_04_24_B.pdf|.md`).
  - `extract.ts` — `extractPages(packetBytes, ranges): Buffer` via pdf-lib.
  - `frontmatter.ts` — builds the `.md`: YAML front matter (taxonomyId, scores, flags, description, pages, packet sha, `derivedFrom {sourceKey, pages, operation:"extract", actor, timestamp}`, approvedBy/At) + concatenated per-page markdown pulled from the run artifacts.
  - `router.ts` — approve endpoint; list/download approved docs.
- New table `approved_documents` (`lib/db/src/schema/approved-documents.ts`): `{ id, applicationId, blockId, variantId?, basename, data jsonb, approvedBy, approvedAt }`. Append-only; this is the registry — pre-approval splits/assignments stay in run data + intake flow and are never in it.
- Trigger: accept verdict on a block/variant. Never automatic during analysis.

## Phase 3B — Variant shape library (conventions library)
Goal: descriptor keys stay identical across templates. Mirror saved-sections exactly (copy-on-use, never linked).
- Contract: `VariantShape { id, name, variantNoun, descriptorFields, docsPerVariant?, preset?: boolean }`; `GET /variant-shapes`, `POST /variant-shapes` (save from builder). Additive only.
- DB: `variant_shapes` table, same jsonb-row pattern as saved_sections; presets seeded with `preset: true`, id `vs-preset-<slug>` (idempotent upsert on boot or seed script).
- Presets (~20): bank statement, pay stub, W-2, 1099, tax return, government ID, passport, pension/SSA award, employment verification letter, mortgage statement, HOA statement, insurance policy, utility bill, retirement/brokerage statement, gift letter, lease agreement, title deed, credit report, business license, K-1.
- Builder UX in `VariantConfigEditor`: when a block flips to arity:set, a shape picker (preset / saved / custom) pre-fills noun+fields; "Save as shape…" writes the current config to the library. Picking = one UPDATE_BLOCK patch copying the shape's fields — no reference kept.
- Guard: saving requires non-empty noun + ≥1 field with key; duplicate names 409.

## Phase 3C — Document-sequence approval flow (per-document approval; unlocks set blocks end-to-end)
The unit a human approves is a DOCUMENT (see internal_docs/_future/document-approval-flow.md — decisions already ruled).
- Contract: `DocumentApproval { id, runId, blockId, variantId?, pages [first,last], pageDecisions {page: good|bad}, outcome approved|approved_incomplete|rejected, decidedBy, decidedAt }`; stored on the application (`documentApprovals?: DocumentApproval[]`, additive). Endpoints: `POST /applications/{id}/document-approvals` (validates run doc exists, variant exists for set blocks, all pages decided) + list via Application.
- Materialization: the POST calls the SAME `materializeApproval` seam, extended with an explicit-source overload `{runId, pages, blockId, variantId}` (skips block-level source resolution). `approved_incomplete` writes the registry row with an `incomplete: true` + `newVersionRequested: true` marker in `data` and the .md front matter — loudly visible everywhere the doc is listed.
- Supersede scope for set blocks: per (blockId, variantId, pages-overlap) — a re-approved statement supersedes the prior row for the same variant+period, other documents in the variant untouched.
- UI (ReviewPage/filmstrip): page-group highlight for the current run document, per-page good/not-good, roll-up prompt when all pages decided (approve / approve-incomplete / reject), variant picker on the roll-up for set blocks. Canvas mockups first unless user waives.
- Block-level settle: a set block reads as covered when every declared variant has ≥1 live approved (non-rejected) document and docsPerVariant guidance is met or waived; client caseData derives this — no engine change.

## Phase 3D — Approved-registry surface in the case file
Small, read-only: an "Approved documents" strip/tab in the case file listing live registry rows (basename, block, variant, incomplete badge, superseded history collapsed), download pdf/md via existing endpoints. No new server work.

## Phase 5 — Multi-file intake (manifest v1)
Per internal_docs/_future/multi-file-intake.md: packet = manifest of files with per-file X-remove only; no defer queue, no Drive ingestion. Ships after Phase 4 — analyzer consumes a concatenated packet exactly as today, so this is intake/preflight + raster plumbing, additive contract (`packet.files[]`).

## Sequencing
3B (no dependencies) → 3C (needs 3B only for nicer labels, hard-depends on Phase 3 seam — done) → 3D (needs 3C's incomplete marker) → 4 (independent of 3C UI; consumes run + variants) → 5 last (touches packet ingestion, riskiest blast radius).

## Phase 4 — Satisfaction pass (analyzer)
Per set block with ≥1 assigned doc: text-LLM over structured inputs only (rules + analysisNote + per-doc coreFields/scores/flags/pages). Write-once `satisfaction/block-<id>.json` + additive run-payload field; per-variant groups + gaps + one-paragraph summary; superseded (re-run per block) after human reassignment. Cost folded into existing run gate. Spec'd in detail when Phase 3 lands.

## Guard-rails
- No storage moves; no new storage abstraction — new prefixes on the existing module pattern only.
- All contract changes additive; old templates/apps parse unchanged.
- Descriptor identity is assistive — humans can always re-assign; overrides are audit rows.
- No conditional logic in rules — data-shaped constraints only (v1 restraint stands).
- Each phase ships alone; feature folders per concern, front and back.
