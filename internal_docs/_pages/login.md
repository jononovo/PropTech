# Login — `/login`

**Purpose.** Attribute every action to a person with zero pretend security: pick who's working, get recorded as them (`decidedBy` on verdicts, initials in the chrome).

**The thinking.** Demo auth is a fixture, not a shortcut to fix later by accident — the schema is kept auth-shaped so *real* auth replaces only the edge (login mechanism + server enforcement), never the data model. Decided: **never Clerk**. Honesty over theater: passwords are plaintext `"1234"` *by design*, and nothing is enforced server-side — better an obviously-fake gate than a half-real one.

**How it works.**
- `GET /users` lists the 4 seeded profiles (Ron/Originator, Dana/Underwriter, Priya/Underwriter, Marcus/Manager) as cards.
- **One-click sign-in** (Jul 24, 2026, for testing speed): clicking a card auto-submits the demo password through the real `POST /login`. The manual username/password form below still works; 401 renders inline.
- The user object lives whole in `localStorage` (`sheaf.profile`); the app gates on its presence; `useProfile()` serves it everywhere. Sign out = avatar menu → clears storage → back here.

**Peculiarities.**
- No sessions, no tokens — the API is wide open; the login call only validates the pair.
- Role change = sign in as someone else. That *is* the feature.

**Done.** Cards, one-click, manual form, error states, DB seeding (`users.json` when table empty).

**Open.**
- *Open — feature:* real authentication (parked in `_future.md`); unblocks server-side enforcement, edit attribution, tokenized applicant links.
