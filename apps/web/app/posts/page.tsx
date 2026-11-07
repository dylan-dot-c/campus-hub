import { Suspense } from "react";
import { Post } from "./Post";
import { PostList, PostListSkeleton } from "./PostList";

export default function PostsPage() {
  return (
    <>
      <Post />
      {/* Only the list waits; the form above is usable right away. */}
      <Suspense fallback={<PostListSkeleton />}>
        <PostList />
      </Suspense>
    </>
  );
}
