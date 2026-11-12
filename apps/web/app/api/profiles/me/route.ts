import { currentUserId } from "@project/auth";
import { UpdateProfile, updateProfile } from "@project/domain";
import { revalidatePath } from "next/cache";

const error = (status: number, code: string, message: string) =>
  Response.json({ error: { code, message } }, { status });

export async function PATCH(req: Request) {
  try {
    const userId = await currentUserId();
    if (!userId) return error(401, "UNAUTHENTICATED", "Sign in first");
    let body: unknown;
    try { body = await req.json(); }
    catch { return error(400, "BAD_JSON", "Body must be valid JSON"); }
    const parsed = UpdateProfile.safeParse(body);
    if (!parsed.success) return error(400, "VALIDATION", parsed.error.issues[0]?.message ?? "Invalid input");
    const profile = await updateProfile(userId, parsed.data);
    revalidatePath("/profile");
    return Response.json({ profile });
  } catch (cause) {
    const code = (cause as { code?: string })?.code;
    if (code === "P2025") return error(404, "NOT_FOUND", "Profile not found");
    if (code === "P2003") return error(404, "NOT_FOUND", "College not found");
    return error(500, "INTERNAL_ERROR", "Could not save profile. Try again.");
  }
}
