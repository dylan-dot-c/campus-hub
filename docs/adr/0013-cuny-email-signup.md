# ADR-0013: Signup restricted to CUNY email addresses

## Status

Accepted

## Context

[ADR-0012](0012-email-password-auth.md) moved accounts to email + password
and left open whether signup should be limited to student email domains.
Campus Hub is for CUNY students; an open signup lets anyone with any email
create an account.

## Decision

Signup accepts only emails at `cuny.edu` or any subdomain of it (e.g.
`baruch.cuny.edu`). The rule lives in the shared `Student` Zod schema in
`packages/domain`, so every entry that creates a student enforces it.

- **Match**: the domain must be exactly `cuny.edu` or end in `.cuny.edu`,
  checked after trimming and lowercasing. A plain suffix check is not used —
  it would admit `notcuny.edu`.
- **Rejection**: a non-CUNY email is a 400 `VALIDATION` error.

## Consequences

- **Easier**: the community is CUNY-only by construction; no allowlist to
  maintain as campuses use different subdomains.
- **Harder**: a domain check proves only that an address looks like CUNY,
  not that the person owns it — that needs email verification, which is not
  part of this decision.
- Alumni or students without an active CUNY address cannot sign up.

## See also

- `docs/specs/auth.md` — the signup contract.
- [ADR-0012](0012-email-password-auth.md) — the email + password decision
  this narrows.
