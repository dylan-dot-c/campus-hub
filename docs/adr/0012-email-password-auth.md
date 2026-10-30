# ADR-0012: Email + password accounts instead of GitHub OAuth

## Status

Accepted

## Context

The auth spec targeted GitHub OAuth as the only sign-in method, with the
account created on first sign-in. Campus Hub is a social app for students,
and many students have no GitHub account. The `Student` model already
carries `email` and `passwordHash`, and the domain package already hashes
passwords on create.

## Decision

Students create an account with an email and password via a public signup
endpoint (`POST /api/students`). GitHub OAuth is dropped from the plan.

- **Hashing**: salted scrypt from `node:crypto`, stored as `salt:hash` —
  no new dependency.
- **Duplicates**: a second signup with the same email returns 409.
- **Exposure**: `passwordHash` is never selected into a response.

## Consequences

- **Easier**: any student can sign up; no OAuth app to register or secret
  to manage; the existing schema fits as-is.
- **Harder**: the app now owns password storage, login, and eventually
  password reset — work OAuth would have handed to GitHub.
- **Open**: restricting signup to student email domains is possible on top
  of this decision and is not part of it.

## See also

- `docs/specs/auth.md` — the identity contract this changes.
- [ADR-0003](0003-dev-identity-stub.md) — the dev stub still resolves
  identity until login lands.
