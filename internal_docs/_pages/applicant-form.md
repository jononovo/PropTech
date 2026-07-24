# Applicant form — `/apply/:applicationId`

**Purpose.** The contributor-facing page: fill template-defined fields and upload documents, one block at a time. Reached via "Open intake form" / "Copy applicant link" from staff surfaces.

**The thinking.** Doctrine split: ops staff get dense sheets; **contributors get one-thing-at-a-time forms — never tables**. Sections render only what the viewer's role may see (`section.permissions`); uploads enable only where the role may upload. There is deliberately no big "Submit" — every block persists on its own, so a half-done session is never lost and staff see progress live.

**How it works.**
- `useGetApplication` → sections filtered by role permissions; field groups save per-block (`useSaveFieldValues`), documents upload/delete per-block (`useUploadDocument`/`useDeleteDocument`).
- `initializedFor` ref syncs server `fieldValues` into local state exactly once per application.
- A "Viewing as" switcher (Applicant/Originator/Underwriter/Manager) simulates the viewer's role.

**Peculiarities.**
- The URL carries the **raw application id — there is no token**; anyone with the link sees whatever the selected role allows. Acceptable for the demo, a hard gate for real data (retention/access-control spec gate).
- The "Viewing as" switcher is a stand-in for identity that a real tokenized link would carry.

**Done.** Permission-filtered rendering, per-block field save, upload/delete, progress reflection into staff views.

**Open.**
- *Open — feature:* tokenized applicant links + real identity (with real auth) — replaces the role switcher and the raw-id URL.
- *Open — decision:* end-of-form experience — today there's no confirmation/"you're done" state, and the back link points at the staff list (`/applications`), which a real applicant shouldn't see.
