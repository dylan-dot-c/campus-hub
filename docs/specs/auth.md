---
type: infrastructure
---
# Identity — the auth subsystem

Who the current user is, and how every server entry learns it.

## Today: the dev identity stub

`packages/auth/` resolves the current user from the `x-user-id` header, then
`DEV_USER_ID`, then a fallback — **deliberately naive**, and guarded: it throws
in production unless `ALLOW_DEV_IDENTITY` is set. This is the auth seam's
local stand-in (see [seams](seams.md)) and a planted lesson.

## Target: session-derived identity, only

- Auth.js v5 + Prisma adapter, database sessions, email + password (the only
  sign-in method).
- Public surface: landing, /login, /api/health, /api/auth/*, and signup
  (`POST /api/students`). Everything else
  gated; signed-out API calls get 401, pages redirect to /login.
- Identity comes from the session **only**. The client never supplies a user
  id — no header, no param, no dev-only bypass: dev signs in like prod.
- Signup creates the student: email is normalized (trimmed, lowercased) and
  unique — a duplicate returns 409; the password is stored only as a salted
  scrypt hash, and `passwordHash` never appears in a response.

The swap from stub to sessions is epic work — a `sign-in` ticket in the
app's feature epic executes it against this contract.

## Constraints & decisions

- One sign-in method (email + password); OAuth providers are out of scope.
- After the swap, the string `x-user-id` appears nowhere in the codebase.
- Roles/admin, account deletion + export: future work with a privacy doc.

## Key decisions

- [ADR-0003](../adr/0003-dev-identity-stub.md) — why the stub exists and how it's guarded.
- [ADR-0012](../adr/0012-email-password-auth.md) — email + password instead of GitHub OAuth.
