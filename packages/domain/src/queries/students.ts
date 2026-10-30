import { randomBytes, scryptSync } from "node:crypto";
import { prisma } from "@project/db";
import type { CreateStudentInput } from "../schemas/student";

// never return passwordHash to callers
const publicFields = { id: true, email: true, createdAt: true, updatedAt: true } as const;

// salted scrypt hash, stored as "salt:hash"
function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

// gets the current student by userId
export function getStudent(userId: string) {
  return prisma.student.findUnique({ where: { id: userId }, select: publicFields });
}

// creates a student with a hashed password
export function createStudent(input: CreateStudentInput) {
  return prisma.student.create({
    data: { email: input.email, passwordHash: hashPassword(input.password) },
    select: publicFields,
  });
}
