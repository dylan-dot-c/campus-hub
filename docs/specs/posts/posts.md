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
- `apps/web/app/posts/`: the `/posts` page: `Post.tsx` (form),
  `PostList.tsx` (the student's own posts, rendered on the server, plus
  `PostListSkeleton` for loading),
  `error.tsx` (retry card when the list can't load)
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
- The `/posts` page shows the form, then the current student's posts newest
  first (title as a heading, then content). The list has its own loading,
  empty, and error states (see UI states).
- Every error has the shape `{ error: { code, message } }`.

| Path       | Method | Input schema | Error codes                                       | Scoped by |
|------------|--------|--------------|---------------------------------------------------|-----------|
| /api/posts | GET    | none         | 401 UNAUTHENTICATED                               | studentId |
| /api/posts | POST   | CreatePost   | 400 BAD_JSON, 400 VALIDATION, 401 UNAUTHENTICATED | studentId |

## UI states

### Reading: the post list

```mermaid
stateDiagram-v2
    title PostList - State Diagram

    [*] --> loading: open /posts
    loading --> hasData: 1+ posts
    loading --> empty: 0 posts
    loading --> error: list can't load
    error --> loading: Retry
    empty --> hasData: first post created · refresh
    hasData --> hasData: another post created · refresh
```

| State | What the user sees |
|---|---|
| `loading` | The form, ready to use, with a grey skeleton of three post cards below it where the list will go. |
| `hasData` | One list item per post, newest first: title as a heading, then content. |
| `empty` | "No posts yet" and a "Write your first post" link that moves focus to the Title field. |
| `error` | A card saying "Couldn't load your posts" with a Retry button that fetches the list again. |

Arrows tested:
- `[*] --> loading`: In DevTools, throttle the network to Slow 4G, then reload `/posts`.
- `loading --> hasData`: Load `/posts` as `demo-user` after creating a post.
- `loading --> empty`: Load `/posts` with `x-user-id` set to a student with no posts.
- `loading --> error`: Stop the database while `pnpm dev` keeps running, then reload `/posts`.
- `error --> loading`: Start the database again, then press Retry.
- `empty --> hasData` and `hasData --> hasData`: Submit the form; the new post appears at the top.

### Writing: the post form

```mermaid
stateDiagram-v2
    title Post - State Diagram

    [*] --> empty
    empty --> ready: type title
    ready --> empty: erase title
    ready --> posting: submit
    empty --> error: submit (title only spaces)
    posting --> empty: 201 · clear + refresh (new post appears in the list)
    posting --> error: 400 (shows API error message)
    posting --> error: network fail (catch)
    error --> ready: type title
    error --> empty: erase title
    error --> posting: submit
```

Arrows tested:
- `[*] --> empty`: Open `/posts`.
- `empty --> ready`: Type a non-whitespace title.
- `ready --> empty`: Erase the title or replace it with whitespace.
- `ready --> posting`: Enter a title and submit the form.
- `empty --> error`: Type only spaces in the title and press Post; the alert
  reads "Title is required." (A fully empty title is stopped by the
  browser's `required` message instead.)
- `posting --> empty` (201): Untested until a test user exists.
- `posting --> error` (400): Enter a title longer than 120 characters and submit.
- `posting --> error` (network fail): Stop `pnpm dev` after opening `/posts`, then submit.
- `error --> ready`: After an error, type a non-whitespace title.
- `error --> empty`: After an error, erase the title or replace it with whitespace.
- `error --> posting`: After an error, submit again.

The error message sits in a `role="alert"` region that is always in the
page, so screen readers announce it each time the form enters `error`.
Verify with VoiceOver: trigger either error arrow above and hear the message
read without moving focus.

The title field is `required`, so screen readers announce it as required.
The Post button uses `aria-disabled` instead of `disabled`, so it stays in
the Tab order in every state. While the title is blank or a post is in
flight it is announced as dimmed and drawn at half opacity
(`button[aria-disabled="true"]` in `globals.css`); pressing it then never
sends a request.

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
- The list is read on the server (`PostList` is a Server Component): it
  depends only on who is signed in, which the server already knows, so the
  posts arrive with the HTML.
- The list's loading state is a `<Suspense>` boundary around `PostList` in
  `page.tsx`, not a route-level `loading.tsx`, so the form is usable while
  the list loads.
- `createPost` accepts only `title` and `content`. `id`, `studentId`,
  `createdAt` and `updatedAt` are set by the server.
- A post needs a real student behind it (foreign key to `Student`). The
  identity stub's `demo-user` has to exist in the database for create to work.

## Out of scope
- Editing, deleting, or viewing a single post: no spec yet.
- A shared feed of everyone's posts: no spec yet.
- Pagination: no spec yet. (returning a list in chunks).
- Real sign-in: the identity stub reads `x-user-id` until week 8.