import { currentUserId } from "@project/auth";
import { CreateProfile, createProfile, listProfiles } from "@project/domain";

const unauthenticated = () =>
  Response.json(
    { error: { code: "UNAUTHENTICATED", message: "Sign in first" } },
    { status: 401 },
  );

const badJson = () =>
  Response.json(
    { error: { code: "BAD_JSON", message: "Body must be valid JSON" } },
    { status: 400 },
  );

//   handle profile creation
export async function POST(req: Request) {
  const userId = await currentUserId(); // 1 · who's asking
  if (!userId) return unauthenticated();

  let body: unknown; // 2 · what they brought
  try {
    body = await req.json();
  } catch {
    return badJson();
  }
  const parsed = CreateProfile.safeParse(body);
  if (!parsed.success)
    return Response.json(
      {
        error: {
          code: "VALIDATION",
          message: parsed.error.issues[0]?.message ?? "Invalid input",
        },
      },
      { status: 400 },
    );

  const profile = await createProfile(userId, parsed.data); // 3 · do it, as them
  return Response.json({ profile }, { status: 201 }); // 4 · say so
}

// list all profiles oldest to newest

export async function GET() {
  // do not need a userId to see all profiles
  // can change in the future if needed

  return Response.json({ profiles: await listProfiles() });
}
