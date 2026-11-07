// no "use client" here, so this runs on the server
import { currentUserId } from "@project/auth";
import { listPosts } from "@project/domain";

export async function PostList() {
  const userId = await currentUserId();
  const posts = await listPosts(userId);

  if (posts.length === 0) {
    return <p>No posts yet</p>;
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