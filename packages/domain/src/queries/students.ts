import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { prisma } from "@project/db";
import type { CreateStudentInput, SignInInput } from "../schemas/student";

// never return passwordHash to callers
const publicFields = { id: true, email: true, createdAt: true, updatedAt: true } as const;

// salted scrypt hash, stored as "salt:hash"
function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

// constant-time compare against a stored "salt:hash"
function passwordMatches(password: string, stored: string) {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const expected = Buffer.from(hash, "hex");
  return timingSafeEqual(scryptSync(password, salt, expected.length), expected);
}

// an unknown email still pays for one scrypt, so timing doesn't reveal which emails exist
const UNKNOWN_EMAIL_HASH = hashPassword("no-such-student");

// returns the student's id when the credentials match, else null
export async function verifyCredentials(input: SignInInput): Promise<string | null> {
  const student = await prisma.student.findUnique({
    where: { email: input.email },
    select: { id: true, passwordHash: true },
  });
  const matches = passwordMatches(input.password, student?.passwordHash ?? UNKNOWN_EMAIL_HASH);
  return student && matches ? student.id : null;
}

// gets the current student by userId
export function getStudent(userId: string) {
  return prisma.student.findUnique({ where: { id: userId }, select: publicFields });
}

// creates a student with a hashed password
export function createStudent(input: CreateStudentInput) {
  return prisma.student.create({
    data: {
      email: input.email,
      passwordHash: hashPassword(input.password),
      profile: {
        create: {},
      },
    },
    select: publicFields,
  });
}
