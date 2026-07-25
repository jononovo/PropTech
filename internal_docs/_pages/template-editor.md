# Template editor — `/builder/:family/:version`

**Purpose.** Visual editor for a template version: sections → subsections → requirement blocks (documents with dimensions, field groups).

**The thinking.** The template JSON contract (`docs/homium-template-schema-spec.md`) is the real product — the editor is a *view* over it. Drafts are editable; an `active` version renders read-only (inputs become text, palette hides). Document **dimensions** (requirement/criticality/sourcing/expiry + alternatives) are the analyzer's steering input, so the editor surfaces them on every document block.

**History.** The project's longest design exploration. Builder-as-table was rejected outright (the "Schema" mock) → form-style mandate. FormBuilderA (palette-drag hypothesis) beat B (inline inserters); the old Composer mock was mined for the live preview pane and WHO SEES · WHO ADDS permissions; the dimensions round made requirement/criticality/sourcing orthogonal axes ("hotel amenity" exception display; sourcing never applicant-facing). The real editor first ported A's *approved look* only (drag/add affordances rendered but no-op'd). The build-out landed **Jul 25, 2026**: full rebuild (`features/template-editor/` split into state/dnd/components) + a post-merge drop-zone geometry fix. Plan + as-built record: `internal_docs/_future/template-builder-master-plan.md`.

**How it works.**
- `useTemplateDraft` owns the draft; **every** mutation — button, dropdown, or drag — dispatches the same action to the pure `state/templateReducer.ts` (headless-tested: `pnpm --filter @workspace/client exec tsx src/features/template-editor/state/templateReducer.test.ts`).
- **Ids mint once** at creation (`state/templateIds.ts`), never on rename/move — applications pin block ids, so MOVE_* actions carry only ids+indices and are structurally incapable of re-minting.
- DnD is confined to `dnd/` (dnd-kit): kit-native live preview, cross-container transfers happen live in `onDragOver`, Esc/outside-drop restores the pre-drag snapshot (dirty flag included). Palette/saved-section drops append at the hovered container's end.
- **Drop-zone rule:** container droppables cover the WHOLE card — headers and collapsed sections included. Inner-only zones left silent dead space under `pointerWithin` ("drag sometimes doesn't work", fixed Jul 25, 2026). Item cards beat containers in collision, so precise sorting is unaffected.
- **Drags start on grip handles** (hover-revealed); clicking a block card opens its editor — by design, not a bug.
- Deletes cascade: removing blocks/subsections/sections prunes alternative groups, so a save can never 400 on dangling refs. Saved-section insert + duplicate deep-clone with all-new ids (copies-never-links).
- `DOC_TYPES` is a UI convenience list — the contract accepts open strings; the analyzer matches `docType` exact-first, name-fallback.

**Peculiarities.**
- The original real templates came from **seed JSON**; since the build-out the editor authors structure end-to-end.

**Done.** Load/edit/save drafts, read-only active view, full structural authoring (add/remove/rename/reorder sections · subsections · blocks, cross-container moves, drag or click-to-add), dimensions + alternatives editing, saved sections (save-to-library + insert-as-copy), doc-type taxonomy.

**Open.** Nothing structural. Library-side gaps (create form, Export JSON, Retire semantics) live in `template-library.md`.
