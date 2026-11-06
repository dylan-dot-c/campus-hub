---
type: feature
---

# Profiles are publicly listed and created empty for each student

## Why

Profiles provide a student-keyed place for personal and college information. The API currently supports listing profiles and creating an empty profile for the current identity.

## Where it lives

- `apps/web/app/api/profiles/route.ts`: `GET` and `POST /api/profiles`
- `packages/domain/src/schemas/profiles.ts`: `CreateProfile` request schema
- `packages/domain/src/queries/profiles.ts`: `listProfiles`, `getProfile`, and `createProfile`
- `packages/domain/tests/profile-schema.test.ts`: profile request-schema tests
- `packages/auth/src/current-user.ts`: session-based identity used by `POST`
- `packages/db/prisma/schema.prisma`: `Profile` fields and student relationship
- `packages/db/prisma/migrations/0002_profile_description_optional.sql`: makes `description` nullable in the database

## Behavior

- [Signup](../students/students.md) creates an empty profile alongside each
  new student in the same transaction. Existing students are not backfilled
  by signup. The standalone creation endpoint still rejects a duplicate
  profile, including one already created during signup.
- `GET /api/profiles` is public and returns `{ "profiles": [...] }` with every profile ordered by `createdAt` ascending. It does not filter by student or paginate results.
- `POST /api/profiles` resolves the current identity and creates a profile associated with that student's ID. The `Profile.studentId` primary key allows at most one profile per student, and the referenced `Student` row must exist.
- Identity comes from the session cookie only; see [auth](../auth.md).
- A successful `POST` returns 201 with `{ "profile": ... }`. The created profile has no profile fields set; `description`, `linkedin`, `github`, `profileUrl`, and `collegeId` are nullable in the data model.
- `CreateProfile` is `z.object({})`: an empty JSON object is valid, and unrecognized object properties are stripped. The endpoint therefore does not currently accept profile field values for creation.
- Malformed JSON returns 400 with `{ "error": { "code": "BAD_JSON", "message": "Body must be valid JSON" } }`. Valid JSON that is not an object returns 400 with code `VALIDATION`.
- A signed-out `POST` returns 401 `UNAUTHENTICATED`.
- The route does not catch or map database errors. A missing referenced student or a second profile for the same student causes the create query to fail without a route-defined error response. This differs from the error-mapping contract in [web.md](../web.md).

## Examples

| State / input                                                                                   | Behavior                                                                                          |
| ----------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `GET /api/profiles` with no profiles                                                            | 200 with `{ "profiles": [] }`                                                                     |
| `GET /api/profiles` with profiles present                                                       | 200 with all profiles ordered oldest to newest, regardless of caller identity                     |
| `POST /api/profiles` with `{}` and an identity that matches an existing student with no profile | 201 with a newly created, otherwise empty profile                                                 |
| `POST /api/profiles` with malformed JSON                                                        | 400 with error code `BAD_JSON`                                                                    |
| `POST /api/profiles` with valid non-object JSON, such as `[]`                                   | 400 with error code `VALIDATION`                                                                  |
| `POST /api/profiles` with `{ "description": "Hello" }`                                          | The object is accepted, but the unknown field is stripped; the created profile has no description |
| `POST /api/profiles` when that student already has a profile                                    | The database rejects the duplicate key; the route does not map the failure to a stable API error  |

## UI states

The profile form loads and updates existing profiles as described by
[edit profile](edit-profile.md). It does not call the empty-profile creation
endpoint.

## A11y Notes and brief

The editing form's labels, field errors, focus behavior, and save feedback
are described by [edit profile](edit-profile.md).

## Verify

Run `pnpm test`. The current profile test covers schema parsing only; it does not exercise the HTTP routes or database failure responses.

With the web app and database running, `GET /api/profiles` can be checked with `curl.exe -i http://localhost:3000/api/profiles`. To check creation in development, sign in, copy the `session` cookie's value from DevTools → Application → Cookies, and send it:

```cmd
curl.exe -i -X POST http://localhost:3000/api/profiles -H "Content-Type: application/json" -H "Cookie: session=YOUR_SESSION_TOKEN" -d "{}"
```

## Constraints & decisions

- The student ID is both the profile primary key and its foreign key to `Student`, enforcing one profile per student.

## Out of scope

- Editing existing profile fields is described by [edit profile](edit-profile.md).
- Deleting profiles and fetching one profile through an HTTP route have no owning feature spec yet.
