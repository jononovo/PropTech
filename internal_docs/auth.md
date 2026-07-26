# Auth — session-cookie identity (v2)

Two layers, deliberately separated:

1. **Who you are (authentication)** — POST `/login` verifies credentials and issues a signed **session cookie**. Demo-grade today (4 seeded users, password `"1234"` plaintext by design); real auth later replaces only how the cookie gets issued.
2. **What you may do (authorization)** — the access matrix middleware on every `/api` request reads the identity and enforces rights (see `internal_docs/_pages` / `features/access/matrix.ts`).

**Never Clerk** (owner ruling).

## Session cookie

- Name `sheaf_session`, value `<username>.<HMAC-SHA256(username, SESSION_SECRET) base64url>` — stateless, no session table; the signature proves the server issued it (can't be forged from the client, unlike the old localStorage-only identity).
- Set by POST `/login` (HttpOnly, SameSite=Lax, path `/`, 30-day max-age). Cleared by POST `/logout` (exempt from the matrix).
- Because it's a cookie, the browser attaches it to **every** request — fetch, `<img>` page thumbnails, downloads — on any machine the user logs in from. This is why identity moved off the `x-profile` header: custom headers can't ride along on `<img>` requests (the "NO SCAN ON FILE" 401s, Jul 26 2026).
- Code: `artifacts/api-server/src/features/access/session.ts` (sign/verify/set/clear), `cookie-parser` registered in `app.ts`.

## Identity resolution order (middleware)

`features/access/middleware.ts`:
1. Valid `sheaf_session` cookie → that username.
2. Else `x-profile: <username>` header — kept as a curl/testing convenience (`curl localhost:8080/api/... -H 'x-profile: marcus'`).
3. Else 401. Unknown username → 401. Role lacking the required right → 403.
4. `x-sheaf-service: analyzer-worker` — service identity for analyzer loopback callbacks, scoped to `/applications/*` only.

Exempt: `/healthz`, POST `/login`, POST `/logout`, GET `/users` (login page).

## Users & login page

- `users` table in Postgres, seeded from `artifacts/api-server/data/users.json`: Ron Alvarez (Originator), Dana Whitfield (Underwriter), Priya Nair (Underwriter), Marcus Cole (Manager).
- Login page (`artifacts/client/src/features/auth/LoginPage.tsx`) lists profiles as clickable cards; clicking auto-submits the demo password through the real POST `/login` — so a click IS a real login and gets a real session cookie. The manual form works for typed credentials.
- Client keeps the returned user in localStorage (`sheaf.profile`) **for the UI only** (name/role/initials, login gate). It carries no server-side authority; the cookie does. No header plumbing remains in the client.
- The QA agent's self-HTTP portal (`features/qa-agent/portal.ts`) forwards the incoming `cookie` header, so agent tool calls act as the signed-in user.

## Doctrine

- Real auth = replace credential verification in POST `/login` (and password storage). The cookie carrier, middleware, and matrix stay as-is.
- Role changes for testing = sign in as a different profile.
