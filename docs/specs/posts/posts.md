---
type: feature
---
# A signed-in student can create posts and list their own posts

## Why
Students write posts to share questions and updates with other students.
Each student sees only the posts they wrote through this endpoint.

## Where it lives
- `packages/domain/src/schemas/post.ts`: `Post` Zod schema
- `packages/domain/src/queries/posts.ts`: `listPosts`, `createPost`
- `apps/web/app/api/posts/route.ts`: `GET` and `POST /api/posts`
- `packages/domain/tests/post-schema.test.ts`: schema tests


## Behavior
- `GET /api/posts` returns the current student's posts, newest first.
- `POST /api/posts` creates a post owned by the current student.
- The owner (`studentId`) always comes from the signed-in student, never from
  the request body.
- A body that isn't valid JSON returns 400 `BAD_JSON`.
- A body that fails `CreatePost` returns 400 `VALIDATION`.
- A signed-out request returns 401 `UNAUTHENTICATED`.
- A student never sees another student's posts through this endpoint.
- Every error has the shape `{ error: { code, message } }`.

| Path       | Method | Input schema | Error codes                                       | Scoped by |
|------------|--------|--------------|---------------------------------------------------|-----------|
| /api/posts | GET    | none         | 401 UNAUTHENTICATED                               | studentId |
| /api/posts | POST   | CreatePost   | 400 BAD_JSON, 400 VALIDATION, 401 UNAUTHENTICATED | studentId |

## Examples

| State / input | Behavior |
|---|---|
| POST `{"title":"First week","content":"Where is the library?"}` | 201, returns the new post |
| POST `{}` | 400 `VALIDATION` |
| POST `{"title":"   ","content":"Hi"}` | 400 `VALIDATION`, since title is trimmed and can't be empty |
| POST `not json` | 400 `BAD_JSON` |
| GET as a different student | 200, empty list |

## Verify
- `pnpm test` from the repo root runs the `Post` schema tests.
- With `pnpm dev` running, create a post with curl, then
  `curl -s localhost:3000/api/posts -H 'x-user-id: someone-else'` should
  return an empty list.

## Constraints & decisions
- `createPost` accepts only `title` and `content`. `id`, `studentId`,
  `createdAt` and `updatedAt` are set by the server.
- A post needs a real student behind it (foreign key to `Student`). The
  identity stub's `demo-user` has to exist in the database for create to work.

## Out of scope
- Editing, deleting, or viewing a single post: no spec yet.
- A shared feed of everyone's posts: no spec yet.
- Pagination: no spec yet. (returning a list in chunks).
- Real sign-in: the identity stub reads `x-user-id` until week 8.