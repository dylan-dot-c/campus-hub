import {
  clearedSessionCookie,
  createSession,
  deleteSession,
  sessionCookie,
  tokenFromRequest,
} from "@project/auth";
import { SignIn, getStudent, verifyCredentials } from "@project/domain";

export const dynamic = "force-dynamic";

// sign in — public; the same 401 for a wrong password and an unknown email
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

  const parsed = SignIn.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: { code: "VALIDATION", message: parsed.error.issues[0]?.message ?? "Invalid input" } },
      { status: 400 }
    );
  }

  const studentId = await verifyCredentials(parsed.data);
  if (!studentId)
    return Response.json(
      { error: { code: "INVALID_CREDENTIALS", message: "Email or password is incorrect" } },
      { status: 401 }
    );

  const token = await createSession(studentId);
  const student = await getStudent(studentId);
  return Response.json({ student }, { headers: { "Set-Cookie": sessionCookie(token) } });
}

// sign out — ends only this browser's session; safe to repeat
export async function DELETE(req: Request) {
  const token = tokenFromRequest(req);
  if (token) await deleteSession(token);
  return new Response(null, { status: 204, headers: { "Set-Cookie": clearedSessionCookie() } });
}
