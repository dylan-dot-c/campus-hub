# @project/auth — identity / auth

The "who is the current user?" logic: database sessions behind an HttpOnly
cookie. The contract is `docs/specs/auth.md`.

## Public API

All exports come from `src/index.ts`:

| Export | What it does |
|---|---|
| `currentUserId()` | Returns the signed-in student's id from the `session` cookie, or `null`. |
| `createSession(studentId)` | Inserts a `Session` row and returns the raw token. Call only after verifying credentials. |
| `deleteSession(token)` | Deletes that token's session (sign out). |
| `sessionCookie(token)` / `clearedSessionCookie()` | `Set-Cookie` header values that set or clear the cookie. |
| `tokenFromRequest(req)` | Reads the session token from a `Request`'s `Cookie` header. |

## Dependencies

- `@project/db` — the `Session` table
- `next` — `next/headers` (`currentUserId()` reads the request's cookies)

## Consumers

- `apps/web` — via `@project/auth`

## How a request is identified

```ts
currentUserId()
  1. read the `session` cookie            → none: null
  2. SHA-256 the token, find the Session  → none: null
  3. expired?                             → yes: null
  4. return session.studentId
```

The token is never stored — only its hash — so a database leak hands out no
working cookies. Signing out deletes the row, so a stale cookie stops working.
