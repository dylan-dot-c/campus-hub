# ADR-0014: Hand-rolled database sessions instead of Auth.js

## Status

Accepted

## Context

[ADR-0012](0012-email-password-auth.md) made email + password the only
sign-in method, and the auth spec named Auth.js v5 with the Prisma adapter
and database sessions as the implementation. Auth.js's Credentials provider
(its email + password path) does not create database sessions — it only
supports JWT sessions. A JWT stays valid until it expires, so signing out
cannot revoke it, which breaks the spec's requirement that a signed-out
cookie stops working. The Prisma adapter also expects a `User` model, while
this app's identity root is `Student`.

## Decision

The app owns its sessions directly, with no auth library.

- **Store**: a `Session` table keyed to `Student`. Each row holds a hash of
  the session token, never the token itself.
- **Token**: 32 random bytes from `node:crypto`, sent to the browser as an
  HttpOnly cookie. The server hashes it with SHA-256 and looks the hash up
  on every request — the token has enough entropy that a slow hash adds
  nothing.
- **Sign-in / sign-out**: route handlers in the web app. Password checks
  reuse the existing salted scrypt hash and compare in constant time.
- **The seam**: `currentUserId()` keeps its name and moves from the header
  stub to the session lookup, returning `null` when no valid session exists.
  The dev stub and `ALLOW_DEV_IDENTITY` are removed.

## Consequences

- **Easier**: no new dependency; sign-out and expiry are a row delete or a
  timestamp check; the schema fits `Student` as-is.
- **Harder**: the app owns the security details a library would carry —
  cookie flags, token hashing, expiry, constant-time comparison — and the
  tests have to pin each of them.
- **Open**: rate-limiting sign-in attempts, password reset, and pruning
  expired session rows are not part of this decision.

## See also

- `docs/specs/auth.md` — the identity contract this implements.
- [ADR-0012](0012-email-password-auth.md) — email + password, which this
  implements without Auth.js.
- [ADR-0003](0003-dev-identity-stub.md) — the dev stub this replaces.
