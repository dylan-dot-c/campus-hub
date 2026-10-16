import { prisma } from "@project/db";
import type { CreatePostInput } from "../schemas/post";

export function listPosts(userId: string) {
  return prisma.post.findMany({ where: { studentId: userId }, orderBy: { createdAt: "desc" } });
}

export function createPost(userId: string, input: CreatePostInput) {
  return prisma.post.create({ data: { studentId: userId, ...input } });
}