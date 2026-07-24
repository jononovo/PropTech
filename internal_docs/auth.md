# Auth — demo sign-in (v1)

Deliberately minimal: enough to attribute actions to a person, zero real security. Real auth is deferred (see `_future.md`) — **never Clerk**.

## How it works

- `users` table in Postgres, seeded from `artifacts/api-server/data/users.json` when empty: Ron Alvarez (Originator), Dana Whitfield (Underwriter), Priya Nair (Underwriter), Marcus Cole (Manager). All passwords `"1234"`, stored plaintext **by design** (demo fixture, not a shortcut to fix).
- API: `GET /users` (public list, passwords omitted), `POST /login` → 200 with user / 401 / 400.
- Login page fetches the profiles from the DB and renders them as clickable cards; clicking pre-fills the credentials. Submit goes through the real login endpoint; 401 shows an inline error.
- The signed-in user lives **whole in localStorage** (`sheaf.profile`). No sessions, no tokens, nothing enforced server-side.
- App shell gates on profile presence; `useProfile()` supplies `{profile, logout}` everywhere. Verdicts record `decidedBy` from the active profile (role enum: Originator | Underwriter | Manager).

## Where

- Server: `artifacts/api-server/src/features/users/` (store + router).
- Client: `artifacts/client/src/features/auth/` (LoginPage, ProfileContext).

## Doctrine

- Schema is kept auth-shaped so real auth replaces only the edge (login mechanism + server-side enforcement), not the data model.
- Until then: role changes = sign in as a different profile.
