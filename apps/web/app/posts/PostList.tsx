// no "use client" here, so this runs on the server
import { currentUserId } from "@project/auth";
import { listPosts } from "@project/domain";

export async function PostList() {
  const userId = await currentUserId();
  const posts = await listPosts(userId);

  if (posts.length === 0) {
    return (
      <p>
        No posts yet. <a href="#title">Write your first post</a>
      </p>
    );
  }

  return (
    <ul>
      {posts.map((post) => (
        <li key={post.id}>
          <h2>{post.title}</h2>
          <p>{post.content}</p>
        </li>
      ))}
    </ul>
  );
}

// Shown by <Suspense> in page.tsx while PostList is loading.
export function PostListSkeleton() {
  return (
    <div>
      <p className="sr-only">Loading your posts…</p>
      <ul aria-hidden="true" className="space-y-3">
        {[1, 2, 3].map((n) => (
          <li key={n} className="animate-pulse space-y-2">
            <div className="h-5 w-1/3 rounded bg-neutral-200" />
            <div className="h-4 w-2/3 rounded bg-neutral-200" />
          </li>
        ))}
      </ul>
    </div>
  );
}
