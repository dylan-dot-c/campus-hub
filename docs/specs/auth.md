---
type: infrastructure
---
# Identity — the auth subsystem

Who the current user is, and how every server entry learns it.

## Purpose

Every query is scoped by the current student, so the whole app rests on one
answer: whose request is this? `packages/auth/` answers it from a
server-side session and nothing else. Pages, route handlers, and server
actions all ask the same function, `currentUserId()`.

## The contract

- **Identity comes from the session only.** The client never supplies a
  user id — no header, no param, no dev-only bypass. Dev signs in like prod.
- `currentUserId(): Promise<string | null>` reads the session cookie, hashes
  the token, and returns the `studentId` of a matching, unexpired `Session`
  row — or `null`.
- **Signed out**: pages redirect to `/login`; route handlers return 401
  `{ error: { code: "UNAUTHENTICATED", message } }`.
- **Public surface**: landing (`/`), `/login`, `/signup`, `/api/health`,
  `GET /api/colleges`, signup (`POST /api/students`), and sign-in /
  sign-out (`/api/sessions`). Everything else is gated.

## Sessions

| Field | Rule |
|---|---|
| `id` | uuid primary key |
| `tokenHash` | SHA-256 hex of the token, unique — the raw token is never stored |
| `studentId` | the owning student; deleting the student deletes its sessions |
| `expiresAt` | 30 days after sign-in; not extended by activity |
| `createdAt` | set on insert |

- **Token**: 32 bytes from `crypto.randomBytes`, base64url-encoded.
- **Cookie**: named `session`; `HttpOnly`, `SameSite=Lax`, `Path=/`,
  `Max-Age` 30 days; `Secure` when `NODE_ENV=production`.
- An expired or unknown token resolves to `null`, exactly like no cookie.
- A student may hold several sessions (one per browser); signing out ends
  only the current one.

## Endpoints

| Request | Result |
|---|---|
| `POST /api/sessions` `{ email, password }` — valid | 200 `{ student }` (public fields) + `Set-Cookie` |
| `POST /api/sessions` — wrong password **or** unknown email | 401 `INVALID_CREDENTIALS`, same message for both |
| `POST /api/sessions` — malformed body | 400 `BAD_JSON` / `VALIDATION` |
| `DELETE /api/sessions` | 204; deletes the current session row if any and clears the cookie; idempotent |
| `POST /api/students` (signup) — valid | 201 `{ student }` + `Set-Cookie`; the new student is signed in |

## Signup

Email is normalized (trimmed, lowercased), must be at `cuny.edu` or a
subdomain of it (else 400), and is unique — a duplicate returns 409. The
password is stored only as a salted scrypt hash, and `passwordHash` never
appears in a response. A successful signup starts a session exactly as
sign-in does, and the signup page then navigates to `/profile`. A rejected
signup (400 or 409) sets no cookie.

## Origin check

`apps/web/middleware.ts` runs on every `/api/*` request with a method other
than `GET`, `HEAD`, or `OPTIONS`:

| `Origin` header | Result |
|---|---|
| host matches the request's `x-forwarded-host`, else `Host` | passes through |
| a different host, or `null` | 403 `FORBIDDEN`; the handler never runs |
| absent | passes through — browsers always send it on these methods, so its absence means a non-browser client with no ambient cookies |

## Pages

- `/login`: email + password form posting to `POST /api/sessions`; on
  success it navigates to `/profile`; on 401 it shows one generic error.
- The root layout's header shows a sign-out button when signed in, and a
  sign-in link when not.

## Constraints & decisions

- One sign-in method (email + password); OAuth providers are out of scope.
- Email normalization is the same at sign-in as at signup, so
  `Name@Baruch.CUNY.edu` signs into the account created as
  `name@baruch.cuny.edu`.
- Password comparison uses `crypto.timingSafeEqual`. An unknown email still
  runs one scrypt hash, so response time doesn't reveal which emails exist.
- CSRF has two layers: `SameSite=Lax` keeps the cookie off cross-site
  POSTs, and the Origin check rejects them outright, covering browsers or
  same-site neighbors that Lax alone would let through.
- The string `x-user-id` appears nowhere in code or tests; `DEV_USER_ID` and
  `ALLOW_DEV_IDENTITY` are gone.
- Out of scope: rate-limiting sign-in, password reset, email verification,
  pruning expired rows, "sign out everywhere", roles/admin, account deletion
  + export (future work with a privacy doc).

## Verify

- `pnpm test` covers: valid sign-in and valid signup each set the cookie
  and create a row; a rejected signup sets no cookie;
  wrong password and unknown email both 401 with the same body; a tampered,
  expired, or signed-out token resolves to `null`; a gated route without a
  cookie returns 401; one student never sees another's posts; a cross-site
  `Origin` gets 403 while same-site, proxied, and Origin-less requests pass.
- `git grep -n "x-user-id" -- ':!docs'` prints nothing.
- Drills, run in a browser against `pnpm dev`:
  1. **Remembers you** — sign in, refresh, close the tab, reopen: still
     signed in.
  2. **Forgets you** — sign out, press back: nothing private renders.
  3. **Ticket, not a name** — in DevTools → Application → Cookies, change one
     character of `session` and reload: signed out.
  4. **Zero bleed** — two students in two browsers each create a post; neither
     sees the other's private data, and opening the other's resource URL
     returns 404.

## Key ADRs

- [ADR-0003](../adr/0003-dev-identity-stub.md) — the dev stub this replaced.
- [ADR-0012](../adr/0012-email-password-auth.md) — email + password instead of GitHub OAuth.
- [ADR-0013](../adr/0013-cuny-email-signup.md) — signup limited to CUNY emails.
- [ADR-0014](../adr/0014-hand-rolled-database-sessions.md) — hand-rolled database sessions instead of Auth.js.
