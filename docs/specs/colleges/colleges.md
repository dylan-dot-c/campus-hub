---
type: feature
---
# Anyone can list and search CUNY colleges

## Why
Students pick their college from a fixed list, and people browsing the app
can see which campuses are on it — before signing up or making a profile.

## Where it lives
- `packages/domain/src/queries/colleges.ts`: `listColleges`
- `apps/web/app/api/colleges/route.ts`: `GET /api/colleges`
- `apps/migrate/src/seed.ts`: seeds the colleges
- `tests/integration/colleges.test.ts`: query tests against PGlite

## Behavior
- `GET /api/colleges` returns every college, sorted by name A→Z, as
  `{ colleges: [{ id, name, borough }] }`.
- `GET /api/colleges?q=<text>` returns only colleges whose name contains
  `<text>`, ignoring case. An empty or whitespace-only `q` is treated as no
  filter.
- No match returns 200 with an empty list, not 404.
- The endpoint is public: it needs no identity and never returns 401.
- Colleges are shared reference data, not owned by any student, so the
  query is not scoped by the current user (see AGENTS.md ground rules).
- There is no endpoint to create, edit or delete a college.
- Every error has the shape `{ error: { code, message } }`.

| Path          | Method | Input        | Error codes | Scoped by |
|---------------|--------|--------------|-------------|-----------|
| /api/colleges | GET    | optional `q` | none        | none (public) |

## Examples

| State / input | Behavior |
|---|---|
| GET `/api/colleges` | 200, Baruch, Lehman, Queens in that order |
| GET `/api/colleges?q=queens` | 200, only Queens College |
| GET `/api/colleges?q=BAR` | 200, only Baruch College |
| GET `/api/colleges?q=   ` | 200, all colleges |
| GET `/api/colleges?q=harvard` | 200, empty list |
| GET with no `x-user-id` header | 200, same as signed in |

## Verify
- `pnpm test:integration` runs the colleges integration tests (`pnpm test`
  does not include `tests/integration/`).
- With `pnpm dev` running and `pnpm db:seed` applied:
  `curl -s localhost:3000/api/colleges` lists the three seeded colleges, and
  `curl -s 'localhost:3000/api/colleges?q=queens'` returns only Queens.

## Constraints & decisions
- The seed is the only source of colleges. It upserts each one by a fixed
  id (`baruch`, `queens`, `lehman`), so running it twice creates no
  duplicates. College names are not unique in the schema; fixed ids avoid a
  migration.
- Seeded colleges: Baruch College (Manhattan), Queens College (Queens),
  Lehman College (Bronx).
- `createdAt` and `updatedAt` are not returned; the list is reference data.
- No pagination: the list is small and fixed.

## Out of scope
- Choosing a college on a profile: owned by [profiles](../profiles/profiles.md).
- Adding, editing or removing colleges through the app: no spec yet.
- Students filtered by college: no spec yet.
