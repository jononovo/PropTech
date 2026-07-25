# Template Builder — Master Plan & As-Built Record (Jul 25, 2026)

Status: **built on branch `claude/template-builder`, browser-verified end-to-end.** This doc is the
plan the build followed and the record the builder agent reviews against. Style: decisions, not prose.

## 1. What was wrong (verified before building)

The old `TemplateEditor.tsx` (one 490-line file) was a visual mockup: no DnD library installed, no
`draggable`/handlers anywhere, grips decorative; Add Section/subsection/block, Remove, Save-as-block,
add-alternative, permission toggles all had **no onClick**; name/formats/weight inputs were
uncontrolled (silently discarded); Req was local-only state. Only title, docType, and Save Draft
actually worked. DnD never existed in git history — this was a build, not a regression fix.

## 2. Invariants (enforced structurally, not by convention)

1. **Block-ID stability** — ids are minted ONCE at creation (`state/templateIds.ts`, house slug
   style: `urla-1003`), never re-derived on rename, never touched by moves. MOVE_* actions carry only
   ids + indices and are structurally incapable of minting. WHY: applications pin block ids —
   uploads, verdicts, analysis mapping, additive repin all key on them; server validation cannot
   catch re-minting (uniqueness passes). Unit-tested: reorder/move/cross-container ⇒ id set unchanged.
2. **Copies re-mint** — saved-section insert + section duplicate deep-clone with all-new ids
   (copies-never-links; can't impersonate pinned ids). Unit-tested.
3. **Single mutation path** — every button, dropdown, and drag dispatches the same
   `templateReducer` action. The DnD layer only translates gestures → actions (`dnd/BuilderDnd.tsx
   dropToAction()`); it can do nothing a button can't.
4. **Reducer purity** — no React, no fetching, no Date/random; deterministic slug minting from
   current state. Testable headless (`pnpm dlx tsx .../templateReducer.test.ts`).
5. **Referential integrity** — deleting blocks/subsections/sections prunes alternative groups
   (dead primary ⇒ group dies; empty satisfiedBy ⇒ group dies), so a save can never 400 on dangling
   refs. `requirement !== required_alt` ⇒ block's group dissolves (schema-spec §3 biconditional).
6. **Draft-only editing** — reducer no-ops on `status==='active'` (server 409 stands behind it);
   read-only render preserved.
7. **docType stays an open string** — unknown/future taxonomy ids remain visible + selectable,
   never silently rewritten (guard preserved verbatim).
8. House rules: every file ≤250 lines; `data-testid` on all interactive elements; Ops Desk tokens
   unchanged; no new global store; no shadcn; DnD dep pinned in `artifacts/client`.

## 3. Architecture

```
template-editor/
  state/
    templateIds.ts        slugify/mintId/collectIds/cloneSectionWithNewIds (id doctrine lives here)
    templateActions.ts    discriminated union of EVERY mutation (+BlockPatch/FieldPatch types)
    templateReducer.ts    pure reducer, all invariants; findBlock/findSubsection helpers
    templateReducer.test.ts  12 invariant groups, plain asserts, tsx-runnable, no framework
    docTypes.ts           taxonomy picklist (UI affordance, not enforcement)
  dnd/
    dndModel.ts           typed Drag/Drop payloads + nested-aware collision detection
                          (pointerWithin → rectIntersection → closestCorners, filtered by legality)
    BuilderDnd.tsx        the ONLY file importing @dnd-kit context: sensors (Pointer dist-5 +
                          Keyboard), MeasuringStrategy.Always, portal DragOverlay, dropToAction()
  components/
    Palette.tsx           draggable palette + saved sections; hover "+" = click-to-add (same actions)
    SectionCard.tsx       sortable section: inline rename, owner select, menu (Permissions /
                          Save to library / Duplicate / Remove), WORKING permission toggles
    SubsectionGroup.tsx   sortable subsection: inline rename, remove, sortable block list,
                          + Add document / + Field group
    BlockCard.tsx         sortable display row (DocDimensions, expiry label, docType, multi-page)
    BlockEditor.tsx       advanced editor: Req/Weight/SOURCING/Fmt/Type/multi-page/Expiry
                          (none|staleness+days|hard) + alternatives chips + picker + fields editor
    AlternativePicker.tsx eligible-candidate dropdown (doc blocks only, no self, no double-primary)
    FieldListEditor.tsx   fields-block editor: label/type/required/select-options per field
  useTemplateDraft.ts     the hook: load-once per family/version, dispatch→reducer, dirty flag,
                          save (PUT full doc) + cache write-through + list invalidation + error surface
  TemplateEditor.tsx      shell: header (title/status/dirty/JSON/Save), Palette, canvas, JSON drawer
```

- **DnD tech:** `@dnd-kit/core@6.3.1 + sortable@10.0.0 + utilities@3.2.2` (pins verified against
  npm + React 19.1; the experimental `@dnd-kit/react` 0.x is deliberately NOT used). **Kit-native
  live preview everywhere** (owner decision Jul 25): same-container position preview via sortable's
  own sibling transforms; cross-container drags transfer the item LIVE in onDragOver (real reducer
  MOVE — safe because ids are stable and never re-minted), so the preview is identical across
  sections/subsections. Esc or releasing over empty space restores the pre-drag snapshot. Collision
  is pointer-based (rect overlap only for keyboard), measuring=Always because containers resize
  during live transfers. Palette/saved-section drags create nothing until drop: container highlight
  marks the target list, the new item appends at its end, repositioning then gets full live preview.
  No custom drop indicator exists — one feedback system, the kit's. All @dnd-kit imports confined
  to `dnd/` for cheap future swaps.
- **No API/codegen changes** — PUT already accepts the full contract; server owns version/status.

## 4. Verified in browser (Jul 25, local, real API round-trips)

- Click-to-add: Section → subsection → document block; stats footer updates; dirty chip flips. ✓
- Advanced editor: Weight=critical, Exp=staleness→90-days input, Sourcing dropdown (didn't exist
  before), docType picklist + guard. ✓
- **Save → hard reload:** `pdf · required · critical · stale after 90d` persisted (the old editor
  silently dropped all of this). ✓
- Palette drag-in (document → block list). ✓ Block reorder within list. ✓ Saved-section drag-insert
  (`Income & Assets` → new section, fresh ids minted). ✓ Section reorder by grip. ✓
  **Cross-section block move with id intact** (`pay-stubs-last-30-days` moved between sections,
  kept id AND its own expiry config; source subsection shrank; API JSON confirmed). ✓
- Reducer suite: 12 groups incl. id-set-unchanged-under-moves, active-immutable, prune-on-delete,
  required_alt biconditional, saved-section re-mint uniqueness. ✓

## 5. Deliberately NOT built (with reasons)

- **Live preview pane** (mockup FormBuilderA had Mobile/Desktop/Register + "previewing as
  Applicant") — real feature, separate PR; nothing in this build blocks it.
- **FBA drop-indicator choreography** (2px rule + hollow circle + caption + 2° ghost) — current
  feedback = container highlight + overlay ghost card (rotate-2 kept). Polish pass later.
- **Undo/redo, autosave, multi-select** — explicit Save Draft is the product's honesty model;
  undo invites editing-without-reading; nothing here is hard to add later (single reducer).
- **MOVE_FIELD reorder inside fields blocks** — add/edit/remove shipped; reorder when a real
  template needs it.
- **Server-side id-stability guard** (reject saves that drop ids in use by applications) — worth a
  line in the builder agent's backlog; client reducer is the current line of defense by design.

## 6. Review pointers for the builder agent

- The trap check: `templateReducer.test.ts` group 3 (move/reorder ⇒ id set unchanged) + group 8
  (saved-section re-mint). Run: `pnpm dlx tsx artifacts/client/src/features/template-editor/state/templateReducer.test.ts`.
- `SectionCard.tsx` Duplicate = `INSERT_SAVED_SECTION` with itself (same deep-clone path as library
  inserts — one code path for all copies).
- Deleted: nothing. Old editor fully replaced in place; helpers/DocDimensions untouched.

## 7. Post-merge fixes on main (Jul 25, 2026)

- **Drop-zone geometry** ("drag sometimes doesn't work"): `blocklist:`/`sectionarea:` droppables
  were inner-div-only, so subsection/section HEADERS were dead space under `pointerWithin` — drops
  there silently voided (over=null), and collapsed sections unmounted their drop area entirely.
  Fix: container droppable refs moved to the WHOLE card (shared with the sortable ref) in
  `SubsectionGroup.tsx` / `SectionCard.tsx`; collapsed sections got an isOver cue. Collision
  precedence (items beat containers) unchanged ⇒ precise sorting unaffected. e2e-verified:
  header drops, empty-card drops, grip-based precision reorder, save 200, persisted order checked.
- **Sibling fix, library-side** (same day, PR #7): New-template creation auto-picks the first free
  "New Template N" and toasts on error — was a silent 409 on the fixed default name.
- Reminder encoded in code comments: block/section/subsection drags start on their GRIP handles;
  block-card body click opens the editor.
