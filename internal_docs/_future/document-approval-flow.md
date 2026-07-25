# Document-sequence approval flow (filmstrip sub-feature)

Status: DISCUSSION — needs canvas mockups before build. Captured Jul 25, 2026 from user direction.

## The problem
Everything is analyzed per page, but the unit a human actually approves is a DOCUMENT — e.g. a
3-page bank statement inside a 9-page merged PDF. Today's accept verdict is per-block, which is
too coarse (a set block holds many documents across many variants) and per-page would be too fine.

## The flow (user's description, distilled)
1. Analyzer says: "this 9-page PDF is 3 statements of 3 pages each."
2. In the filmstrip, the current document's pages are highlighted as a group: "this looks like a
   complete bank statement (pp. 4–6) — walk through it." User approves page by page (good / not good).
3. When every page of the group has a decision, a roll-up prompt appears:
   - all pages approved → "Add this statement (pp. 4–6) to <variant> of <block>?" → yes = the
     document is approved and materialized to the approved registry (Phase 3 machinery).
   - some pages rejected → "2 of 3 pages rejected. Add anyway and mark INCOMPLETE (better version
     requested), or reject the document?"
4. Approval is therefore per-DOCUMENT, tagged to a block + (for set blocks) a variant. A block/variant
   is settled only when its documents are approved; later intakes can add more documents to the same
   variant (e.g. March statement arrives weeks after Jan/Feb).

## Key decisions already made
- Page decisions are a PRE-step; nothing lands anywhere until the document-level confirmation.
- Partial approval is allowed but must be loudly marked incomplete + new-version-requested.
- Intake decides how many variants exist; the flow only files documents into them.
- This supersedes block-level accept for set blocks; single blocks can keep the short path
  (block accept ≈ one-document approval).

## Build notes
- This is a filmstrip/ReviewPage iteration — mock up on canvas first (page-group highlighting,
  roll-up prompt, incomplete state).
- Contract sketch: per-document approval record { runId, documentRef/pages, blockId, variantId?,
  pageDecisions, outcome: approved|approved_incomplete|rejected, decidedBy/At }. Must call the same
  Phase 3 materialization function as block accept — one approval seam, two UIs.
