---
type: feature
---
# A CUNY student can sign up with email and password and see their own account

## Why
A student account is the root of everything else: profiles, posts and the
feed all hang off a student. Signup is how someone gets one, and only CUNY
students can.

## Where it lives
- `packages/domain/src/schemas/student.ts`: `Student` Zod schema
- `packages/domain/src/queries/students.ts`: `getStudent`, `createStudent`
- `apps/web/app/api/students/route.ts`: `GET` and `POST /api/students`
- `apps/web/app/signup/SignupForm.tsx`: the signup form (client component)
- `apps/web/app/signup/page.tsx`: `/signup`, renders `SignupForm`
- `packages/domain/tests/student-schema.test.ts`: schema tests
- `tests/integration/students.test.ts`: signup and profile transaction tests

## Behavior
- `POST /api/students` creates a student and an empty linked profile in one
  transaction. It is public: it needs no identity. A successful signup also
  starts a session, so the new student comes back signed in
  ([auth](../auth.md)); a rejected one sets no cookie.
- The profile's `studentId` is the newly created student's ID, never a
  client-supplied ID. Its optional information fields start as null.
- If either record cannot be created, neither record is saved. The response
  still contains only the safe student fields; it does not include the profile.
- The email is trimmed and lowercased, and must be at `cuny.edu` or a
  subdomain of it ([ADR-0013](../../adr/0013-cuny-email-signup.md)).
- The password is 8–128 characters and is stored only as a salted scrypt
  hash. `passwordHash` never appears in any response.
- An email that already has an account returns 409 `CONFLICT`.
- `GET /api/students` returns the current student's own account, never
  anyone else's. Signed out, it returns 401 `UNAUTHENTICATED`.
- A body that isn't valid JSON returns 400 `BAD_JSON`; a body that fails
  `Student` returns 400 `VALIDATION` with the first schema message.
- Every error has the shape `{ error: { code, message } }`.

| Path          | Method | Input schema | Error codes                                       | Scoped by |
|---------------|--------|--------------|---------------------------------------------------|-----------|
| /api/students | GET    | none         | 401 UNAUTHENTICATED                               | studentId |
| /api/students | POST   | Student      | 400 BAD_JSON, 400 VALIDATION, 409 CONFLICT        | none (public signup) |

## UI states

`SignupForm` keeps one `status` (`"idle" | "submitting" | "error"`)
instead of separate booleans, so it can't be submitting and showing an
error at once. `ready` vs `empty` is derived from the inputs, not stored.

```mermaid
stateDiagram-v2
    title Signup - State Diagram

    [*] --> empty
    empty --> ready: type email + password
    ready --> empty: clear a field
    ready --> submitting: submit
    submitting --> [*]: 201 · signed in, navigate to /profile
    submitting --> error: 400 / 409 (shows API error message)
    submitting --> error: network fail (catch)
    error --> ready: edit a field
    error --> submitting: submit
```

- **empty:** button disabled.
- **ready:** both fields filled; button enabled.
- **submitting:** inputs and button disabled; button says "Creating…".
- **error:** the API's `message` shown; inputs keep what was typed.

Arrows to ride:
- `[*] --> empty`: open `/signup`.
- `empty --> ready`: type an email and an 8+ character password.
- `ready --> empty`: erase either field.
- `ready --> submitting`: submit the form.
- `submitting --> [*]` (201): sign up with a new `@baruch.cuny.edu` email;
  `/profile` opens and the header shows "Sign out".
- `submitting --> error` (400): sign up with `you@gmail.com`. It passes the
  browser's email check, so the API's CUNY rule rejects it.
- `submitting --> error` (409): sign up again with the same email.
- `submitting --> error` (network fail): stop `pnpm dev` after opening
  `/signup`, then submit.
- `error --> ready`: after an error, edit a field.
- `error --> submitting`: after an error, submit again.

## Examples

| State / input | Behavior |
|---|---|
| POST `ana@baruch.cuny.edu` with a valid password (8–128 characters) | 201, returns `{ id, email, createdAt, updatedAt }` |
| POST `{"email":"  Ana@Baruch.CUNY.edu ", …}` | 201, email saved as `ana@baruch.cuny.edu` |
| POST `{"email":"ana@gmail.com", …}` | 400 `VALIDATION`, "Use your CUNY email (ending in cuny.edu)" |
| POST `{"email":"ana@notcuny.edu", …}` | 400 `VALIDATION` |
| POST a password of 7 characters | 400 `VALIDATION`, "Password must be at least 8 characters" |
| POST the same email twice | 201, then 409 `CONFLICT` |
| POST `not json` | 400 `BAD_JSON` |
| GET signed in as the seeded `jane.doe@qc.cuny.edu` | 200, Jane's account, no `passwordHash` |
| GET signed out | 401 `UNAUTHENTICATED` |

## Verify
- `pnpm test` runs the `Student` schema tests.
- `pnpm test:integration` verifies signup creates exactly one linked empty
  profile, duplicate-email signup leaves no additional records, and a profile
  creation failure rolls back student creation.
- After a successful signup with `pnpm dev` running, inspect `Student` and
  `Profile` in Prisma Studio: the returned student ID matches the profile's
  `studentId`, and the profile information fields are null.
- With `pnpm dev` running: the curl cases in Examples return the statuses
  shown, and every arrow under UI states has been ridden in the browser.

## Constraints & decisions
- Email + password is the only sign-in method
  ([ADR-0012](../../adr/0012-email-password-auth.md)).
- The domain check proves an address looks like CUNY, not that the person
  owns it; there is no email verification.
- Signup signs the student in; sign-in, sessions, and sign-out are owned by
  [auth](../auth.md).

## Out of scope
- Editing profile information: see [profiles](../profiles/profiles.md).
- Backfilling profiles for existing students and changing the standalone
  profile-creation endpoint.
- Changing email or password, deleting an account: no spec yet.
