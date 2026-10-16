import { prisma } from "@project/db";
import type { CreateProfileInput } from "../schemas/profiles";

// list all profiles from oldest to newest
export function listProfiles() {
  return prisma.profile.findMany({ orderBy: { createdAt: "asc" } });
}

// gets a single profile by userId
export function getProfile(userId: string) {
  return prisma.profile.findUnique({ where: { studentId: userId } });
}

// creates a profile with studentId
export function createProfile(userId: string, input: CreateProfileInput) {
  return prisma.profile.create({ data: { studentId: userId, ...input } });
}
