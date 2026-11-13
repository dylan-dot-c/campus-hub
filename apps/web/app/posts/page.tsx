import { redirect } from "next/navigation";
import { currentUserId } from "@project/auth";
import { Suspense } from "react";
import { Post } from "./Post";
import { PostList, PostListSkeleton } from "./PostList";

export const dynamic = "force-dynamic";

export default async function PostsPage() {
  const userId = await currentUserId();
  if (!userId) redirect("/login");

  return (
    <>
      <Post />
      {/* Only the list waits; the form above is usable right away. */}
      <Suspense fallback={<PostListSkeleton />}>
        <PostList userId={userId} />
      </Suspense>
    </>
  );
}
