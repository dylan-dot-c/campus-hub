import { prisma } from "@project/db";
import type { CreateProfileInput, UpdateProfileInput } from "../schemas/profiles";

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

export function updateProfile(userId: string, input: UpdateProfileInput) {
  const { description, linkedin, github, profileUrl, collegeId } = input;
  return prisma.profile.update({
    where: { studentId: userId },
    data: { description, linkedin, github, profileUrl, collegeId },
  });
}
