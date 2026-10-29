import { currentUserId } from "@project/auth";
import { Student, createStudent, getStudent } from "@project/domain";

export const dynamic = "force-dynamic";

const unauthenticated = () =>
  Response.json(
    { error: { code: "UNAUTHENTICATED", message: "Sign in first" } },
    { status: 401 }
  );

// returns the current student — never anyone else
export async function GET() {
  const userId = await currentUserId();
  if (!userId) return unauthenticated();

  const student = await getStudent(userId);
  if (!student)
    return Response.json(
      { error: { code: "NOT_FOUND", message: "Student not found" } },
      { status: 404 }
    );
  return Response.json({ student });
}

// signup — public, so no identity check
export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json(
      { error: { code: "BAD_JSON", message: "Body must be valid JSON" } },
      { status: 400 }
    );
  }

  const parsed = Student.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: { code: "VALIDATION", message: parsed.error.issues[0]?.message ?? "Invalid input" } },
      { status: 400 }
    );
  }

  try {
    const student = await createStudent(parsed.data);
    return Response.json({ student }, { status: 201 });
  } catch (e) {
    // P2002: unique constraint — email already taken
    if ((e as { code?: string }).code === "P2002")
      return Response.json(
        { error: { code: "CONFLICT", message: "An account with this email already exists" } },
        { status: 409 }
      );
    throw e;
  }
}
