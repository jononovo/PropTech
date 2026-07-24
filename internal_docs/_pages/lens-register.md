# Register lens — `/applications/:id/register`

**Purpose.** The auditor's view: every requirement and filed document in one flat, searchable table — filenames, doc types, parties, dates, quality/format/fraud scores.

**The thinking.** Excel-energy on purpose: when someone asks "show me everything," this is the sheet. Table, not cards; strict column alignment (`colgroup`); mono for data. Search is the primary interaction — `/` focuses it from anywhere on the page.

**History.** The founding view. The product architecture began as "one schema, two renderings": **Register** — the dense ops sheet ("Excel energy," the view the user absolutely loved) — and the segmented contributor form. The *name* is a fossil of the retired Ledger visual language ("a fine-press printed register that came alive"); the Ops Desk pivot killed the aesthetic, the label survived. Export was deliberately absent until it can be real; desktop-only by scope call. **Rename under consideration** (Index / Stack / Table candidates — pending user pick, Jul 24, 2026).

**How it works.**
- Local `query` filters sections/requirements by name, filename, or doc type.
- Rows expand inline to the full metadata panel (scores from `req.doc.scores`, parties, dates, generated filename).
- Header strip derives filed-clean / need-you / on-the-clock counts.

**Peculiarities.**
- Without a run, the footer says "no analyzer run yet — showing checklist only" and most metadata columns sit empty — honest fallback, by design (checklist is real, analysis isn't there yet).
- Generated filenames follow the analyzer naming scheme (`<date>_<blockId>_<issuer>_<party>.pdf`); human renames win when that feature matters.

**Done.** Search, expansion, derived counts, no-run fallback.

**Open.**
- *Open — feature:* export (CSV/JSON) if the audit story ever demands a takeaway artifact — not asked for yet, don't build speculatively.
- Nothing hardcoded beyond fixed column-width percentages (fine).
