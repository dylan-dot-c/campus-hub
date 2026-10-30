import { prisma } from "@project/db";

// lists colleges A→Z; optional q filters by name, ignoring case
// colleges are shared reference data, so this is not scoped by user
export function listColleges(q?: string) {
  const search = q?.trim();
  return prisma.college.findMany({
    where: search ? { name: { contains: search, mode: "insensitive" } } : undefined,
    select: { id: true, name: true, borough: true },
    orderBy: { name: "asc" },
  });
}
