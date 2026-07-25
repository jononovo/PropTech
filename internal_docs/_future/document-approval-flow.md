# Document-sequence approval flow (filmstrip sub-feature)

Status: SHIPPED (3C) — server + client landed & e2e-verified Jul 25, 2026. Client layer: `artifacts/client/src/features/case-file/review/approval/`. Remaining polish candidates: unlink merged groups, per-page flag sourcing from analyzer callouts.

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

## Rulings (Jul 25 2026)
- Direction chosen: **Approval A — Filmstrip Groups** (canvas mockup FilmstripGroups.tsx).
- FINAL visual spec: mockups/doc-approval/FilmstripFinal.tsx (canvas "Approval A — FINAL").
  Combines A2's spread viewer + rail-as-only-confirm-surface with A1's filmstrip hover
  ✓/✕/⚑ controls. Mode model: click page thumbnail = PAGE mode (single page + today's rail);
  click group title chip = DOCUMENT mode (pages spread horizontally + document rail with
  variant picker and Approve / Approve-incomplete / Reject). Segmented [Page|Document]
  control atop the viewer reflects/flips the mode. NO popups anywhere — A1's chip-attached
  inline confirm is dropped. ⚑ = accept-with-flag: flag is retained on the record as a
  low-level note (no new state concepts), optional new-version-requested.
- REUSE mandate: extend existing ReviewPage/filmstrip/viewer components with overlay props
  (group bands, title chips, decision ticks, good/bad control). New components ONLY for
  genuinely-new behavior (roll-up prompt, merge/link affordance, grouping logic), each small
  and separate, mounted conditionally. No new page, no forked near-duplicate components,
  no 1000-line page files — keep ReviewPage a thin composition.

## Rulings (Jul 25 2026, late night — flow mechanics, user Q&A)
- Page→document handoff: when the LAST page of a group gets a decision, the rail auto-switches to
  document mode. The confirmation is a FILING decision ("saving as <block> → <variant> — correct?");
  correcting the analyzer's guessed block/variant is a first-class action there, not an edge case.
- Landing mode: DOCUMENT mode on the first unsettled document (not page mode).
- Approved documents: leave the queue (backend) and gray out/collapse visually.
- ↵ ACCEPT in document mode = approve whole document (for now; may disable later).
- Merge/link lives in the filmstrip, A1-style, between adjacent groups; works across file boundaries.
- Filmstrip = the whole application's working set (all files). Visual grammar: larger spacing +
  file-name divider = arrived as separate files (fact); color bands + title chips = analyzer split
  ONE file into multiple documents (claim needing review). Standalone one-doc PDFs get no color.
- Strip population: OPEN items only by default + a "show all" toggle (approved/dismissed load on
  demand; approved render as collapsed grayed stacked chips, e.g. "Chase Jan ✓ · 3 pp", expandable).
- New arrivals go to the FRONT of the line.
- Order by document type/requirement if easy; otherwise future feature.
- FUTURE (noted, not built): batches — process one uploader's batch separately (Jessica's Friday 20
  vs Joseph's Thursday 20) instead of one giant per-application queue. Queue is per-application.
- Deliverable shape: ONE design, demonstrated in TWO scenarios (merged packet w/ color bands;
  multi-file w/ spacing+dividers+cross-file link) — not two design variants.

## 3C build plan (audited Jul 25 2026, pre-build)
This is an UPGRADE to the existing review feature (`features/case-file/review/`), not a new one.

Current state: ReviewPage.tsx is 705 lines with FilmStrip, PageImage, Rail, ScoreChip etc. defined
inline — already past the size mandate. Step 0 of 3C is a pure mechanical split (no behavior change):

    review/
      ReviewPage.tsx        — thin composition only (~150 lines)
      reviewModel.ts        — existing selector logic (unchanged)
      components/FilmStrip.tsx, PageViewer.tsx, ReviewRail.tsx, ScoreChip.tsx  — extracted as-is

Then 3C adds, each small and single-purpose:
      approval/docGroups.ts       — pure fn: analyzer run → DocumentGroup[] (pages, title, color slot,
                                    block/variant guess). No React. Unit-testable.
      approval/useDocApproval.ts  — page-decision state + roll-up readiness + submit mutation.
      approval/GroupBands.tsx     — overlay rendered BY FilmStrip via an optional `groups` prop
                                    (bands + title chips + per-page ticks). FilmStrip without the
                                    prop renders exactly as today.
      approval/PageDecisionBar.tsx— good/not-good control shown by PageViewer via optional prop.
      approval/RollUpPrompt.tsx   — the confirmation card (variant picker, approve / approve-
                                    incomplete / reject). Mounted only when a group is fully decided.
      approval/MergeLink.tsx      — "link as one document" affordance between adjacent groups.

Deliberately NOT building (over-engineering guard): no per-page comments, no drag-to-regroup, no
keyboard-shortcut system, no generic "annotation layer" abstraction, no new routes/pages, no
gallery-row view (Approval B lost). Server side reuses Phase 3 verbatim: one new endpoint
(POST document approval) that ends in the SAME materializeApproval seam; supersede logic unchanged.

## Build notes
- This is a filmstrip/ReviewPage iteration — NOT a new page. The flow integrates into the existing
  review screen: the filmstrip stays the orientation spine (color-coded document groups + title
  chips + per-page decision ticks live on it), and whatever main-pane layout wins (gallery row /
  docket) replaces or augments the current single-page viewer on that same page. Mockups on canvas
  Jul 25 2026: FilmstripGroups / GalleryRow / DocumentDocket (mockups/doc-approval/).
- Contract sketch: per-document approval record { runId, documentRef/pages, blockId, variantId?,
  pageDecisions, outcome: approved|approved_incomplete|rejected, decidedBy/At }. Must call the same
  Phase 3 materialization function as block accept — one approval seam, two UIs.
