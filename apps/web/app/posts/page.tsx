import { redirect } from "next/navigation";
import { currentUserId } from "@project/auth";
import { Post } from "./Post";

export const dynamic = "force-dynamic";

export default async function PostsPage() {
  if (!(await currentUserId())) redirect("/login");
  return <Post />;
}
