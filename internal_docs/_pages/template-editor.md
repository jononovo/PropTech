# Template editor — `/builder/:family/:version`

**Purpose.** Visual editor for a template version: sections → subsections → requirement blocks (documents with dimensions, field groups).

**The thinking.** The template JSON contract (`docs/homium-template-schema-spec.md`) is the real product — the editor is a *view* over it. Drafts are editable; an `active` version renders read-only (inputs become text, palette hides). Document **dimensions** (requirement/criticality/sourcing/expiry + alternatives) are the analyzer's steering input, so the editor surfaces them on every document block.

**History.** The project's longest design exploration. Builder-as-table was rejected outright (the "Schema" mock) → form-style mandate. FormBuilderA (palette-drag hypothesis) beat B (inline inserters); the old Composer mock was mined for the live preview pane and WHO SEES · WHO ADDS permissions; the dimensions round made requirement/criticality/sourcing orthogonal axes ("hotel amenity" exception display; sourcing never applicant-facing). The real editor ported A's *approved look* — the drag/add wiring was always a next build-out, which is why those affordances render but no-op.

**How it works.**
- `useGetTemplate` → local clone (`initializedFor` ref guards one-time sync) → mutate locally → explicit `useSaveTemplate`.
- Saved-sections library (`useListSavedSections`) for reuse.
- `DOC_TYPES` is a UI convenience list — the contract accepts open strings; the analyzer matches `docType` exact-first, name-fallback.

**Peculiarities.**
- Today's real templates came from **seed JSON**, not this editor — it edits what exists (names, doc types, dimension values) more than it authors structure.

**Done.** Load/edit/save drafts, read-only active view, dimensions editing, saved sections list, doc-type taxonomy.

**Open — the honest list (structural authoring is partly a facade, awaiting the builder build-out):**
- *Stand-in:* palette drag is `cursor-grab` **visual only** — no DnD wiring.
- *Stand-in:* **Add section / Add subsection / Add block** buttons render but no-op.
- *Stand-in:* **Save as block** and **Remove section** menu items are unimplemented.
- *Stand-in:* **Add alternative** (for `required_alt`) is a dead button — alternatives exist only via seed JSON.
- All of the above: *Open — feature* (one coherent editor build-out); none block the engine, which consumes the JSON regardless of how it was authored.
