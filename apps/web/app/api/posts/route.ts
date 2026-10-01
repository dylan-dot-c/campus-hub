import { currentUserId } from "@project/auth";
import { Post, listPosts, createPost } from "@project/domain";

export const dynamic = "force-dynamic";

const unauthenticated = () =>
  Response.json(
    { error: { code: "UNAUTHENTICATED", message: "Sign in first" } },
    { status: 401 }
  );

export async function GET() {
  const userId = await currentUserId();
  if (!userId) return unauthenticated();

  const post = await listPosts(userId);
  return Response.json({ post });
}

export async function POST(req: Request) {
  const userId = await currentUserId();
  if (!userId) return unauthenticated();

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json(
      { error: { code: "BAD_JSON", message: "Body must be valid JSON" } },
      { status: 400 }
    );
  }

  const parsed = Post.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: { code: "VALIDATION", message: parsed.error.issues[0]?.message ?? "Invalid input" } },
      { status: 400 }
    );
  }

  const post = await createPost(userId, parsed.data);
  return Response.json({ post }, { status: 201 });
}
