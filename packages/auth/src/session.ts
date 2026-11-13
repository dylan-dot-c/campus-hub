// Database sessions: the cookie holds a random token, the Session row holds
// only its SHA-256 hash. See docs/specs/auth.md.

import { createHash, randomBytes } from "node:crypto";
import { prisma } from "@project/db";

export const SESSION_COOKIE = "session";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

// the token is 32 random bytes — a fast hash is enough, scrypt adds nothing
const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");

// starts a session for an already-verified student; returns the raw token
export async function createSession(studentId: string): Promise<string> {
  const token = randomBytes(32).toString("base64url");
  await prisma.session.create({
    data: {
      tokenHash: hashToken(token),
      studentId,
      expiresAt: new Date(Date.now() + MAX_AGE_SECONDS * 1000),
    },
  });
  return token;
}

// unknown, tampered, and expired tokens all mean "nobody"
export async function studentIdForToken(token: string): Promise<string | null> {
  const session = await prisma.session.findUnique({
    where: { tokenHash: hashToken(token) },
    select: { studentId: true, expiresAt: true },
  });
  return session && session.expiresAt > new Date() ? session.studentId : null;
}

export async function deleteSession(token: string) {
  await prisma.session.deleteMany({ where: { tokenHash: hashToken(token) } });
}

const cookieAttributes = (maxAge: number) =>
  [
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${maxAge}`,
    ...(process.env.NODE_ENV === "production" ? ["Secure"] : []),
  ].join("; ");

// Set-Cookie header values
export const sessionCookie = (token: string) =>
  `${SESSION_COOKIE}=${token}; ${cookieAttributes(MAX_AGE_SECONDS)}`;
export const clearedSessionCookie = () => `${SESSION_COOKIE}=; ${cookieAttributes(0)}`;

// reads the session token from a request's Cookie header
export function tokenFromRequest(req: Request): string | null {
  for (const pair of req.headers.get("cookie")?.split(";") ?? []) {
    const [name, ...value] = pair.trim().split("=");
    if (name === SESSION_COOKIE) return value.join("=") || null;
  }
  return null;
}
