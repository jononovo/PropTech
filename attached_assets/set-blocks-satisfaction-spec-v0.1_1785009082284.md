# Set Blocks, Satisfaction Pass & Document Versioning — Spec Addendum v0.1
Extends spec v0.6.3 + the provenance note. Sequenced A→D; each phase ships alone. Nothing here modifies parsing, judging, or the run contract's existing fields.

## Concept map
- **Set block** — a requirement satisfied by N logical documents (e.g. "last 3 months bank statements" → per-account sequences), not exactly one upload.
- **Logical document** — one real-world document regardless of how many times/ways it was submitted. Identity key = `(blockId, institution, account_last4, period)` from judge core fields; identity is a *grouping hypothesis*, always human-overridable.
- **Version** — each physical submission mapping to the same logical document. One is `surfaced`; the rest are retained, hidden, never deleted.
- **Satisfaction pass** — third analysis layer: per-block reasoning over the SET of assigned logical documents against the block's rules + note.
- **Tier-2 storage** — approval-time materialized per-requirement PDFs (derived objects), separate prefix from immutable originals; both auditable, linked by `derivedFrom`.

## Phase A — Schema (data only, no behavior)
- Document blocks gain: `arity: "single" | "set"` (default single), optional `analysisNote` (free text, author-written expert guidance), optional `satisfactionRules` (data, not code): `{ requiredCount?, perGroup?: {groupBy: "account", requiredCount, recencyWindowDays}, coverage?: "consecutive_months" }`.
- Additive OpenAPI change; existing templates untouched; builder UI = two quiet fields on the block editor.

## Phase B — Satisfaction pass (highest value, build first)
- Runs after classify+judge, per block with ≥1 assigned document. Text-LLM (GLM-class) over STRUCTURED inputs only: block rules + analysisNote + each assigned doc's {taxonomyId, coreFields, scores, flags, pages}. Never re-reads pixels.
- Output per block, saved as write-once artifact `satisfaction/block-<id>.json` + carried in the run payload (new optional field; additive):
  - `status: satisfied | partial | unsatisfied | needs_review`
  - `groups`: e.g. per account → {institution, account_last4, statements: [{period, docRef, recency}], gaps: ["2026-05 missing"]}
  - `summary`: one paragraph, human-readable ("5 accounts detected; Chase complete; BofA missing May; credit union 1 of 3")
  - `promptVersion`, model, latency — same audit discipline as judge artifacts.
- UI: block header shows status chip + the summary; groups render as the block's detail view. This IS the "list of accounts with details" output requested.

## Phase C — Versioning & surfacing
- New logical-document grouping step when uploads land in an already-populated set block: candidate match on identity key → confirm via cheap comparison (page count, sha, quality/format scores, native-PDF vs scan).
- Auto-surface rules (in order): native PDF beats scan → more pages beats fewer → higher quality score → newer upload. Deterministic, recorded.
- Uncertain match ⇒ review-queue card: "These look identical — (A) same document? (B) which to surface?" Human answer recorded like any verdict (who/when).
- Data: `logical_documents` (identity fields, blockId, surfacedVersionId) + `document_versions` (upload provenance ref, storage key, scores, hidden|surfaced). Append-only; hiding is a flag, never deletion. Satisfaction pass reads surfaced versions only.

## Phase D — Tier-2 materialization (at approval, not before)
- Trigger: block approved / application finalized — never automatic during analysis.
- For each satisfied requirement: extract the surfaced versions' page ranges into per-requirement PDF(s), stored under `approved/<appId>/<blockId>/<derivedName>.pdf` with `derivedFrom: {sourceKey, pages, operation: "extract", actor, timestamp}` (the provenance rule, firing).
- Originals tier untouched and immutable; both tiers readable; audit UI walks derived → source in one hop.

## Guard-rails (anti-over-engineering)
- No new storage abstraction — same object-store module, new key prefixes.
- No nested/quorum block logic beyond `satisfactionRules` data (the portal's "no conditional logic in v1" restraint stands).
- Identity grouping is assistive: every grouping and surfacing choice is a suggestion a human can override, and overrides are audit rows.
- 100-document dumps are handled by existing machinery (pre-flight gate + cost estimate + this pass); no special bulk mode.
