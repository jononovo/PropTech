# _pages — one doc per routed page

Feature docs one level up explain **subsystems** (packet pipeline, persistence, models…). These explain each **page as the user meets it**: why it exists, the thinking behind its main function, how it works, its peculiarities, and an honest ledger of done vs open (hardcoded / awaiting a decision / awaiting a feature).

**Keep these in sync when a page changes.** Status labels used throughout: *Done* · *Stand-in* (hardcoded/decorative on purpose) · *Open — decision* (needs a product ruling) · *Open — feature* (waiting on a build-out).

| Route | File |
| --- | --- |
| `/login` | `login.md` |
| `/` | `dashboard.md` |
| `/applications` | `applications.md` |
| `/templates` | `template-library.md` |
| `/builder/:family/:version` | `template-editor.md` |
| `/applications/:id/:lens?` (chrome + routing) | `case-file.md` |
| — intake lens | `lens-intake.md` |
| — triage lens | `lens-triage.md` |
| — workfile lens | `lens-workfile.md` |
| — timeline lens | `lens-timeline.md` |
| — register lens | `lens-register.md` |
| `/applications/:id/review` | `review-room.md` |
| `/apply/:applicationId` | `applicant-form.md` |

`*` → NotFound exists and is deliberately trivial. The dimensions chips (`features/dimensions/`) are a component, not a page — covered inside `template-editor.md` / `lens-workfile.md` context and `templates.md` (feature doc).
