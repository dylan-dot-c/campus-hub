// Who is asking? Identity comes from the session cookie only — never from a
// header, param, or env var. Returns null when signed out.

import { cookies } from "next/headers";
import { SESSION_COOKIE, studentIdForToken } from "./session";

export async function currentUserId(): Promise<string | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  return token ? studentIdForToken(token) : null;
}
