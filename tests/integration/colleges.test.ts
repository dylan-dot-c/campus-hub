import { describe, it, expect, beforeAll } from "vitest";

// listColleges against in-memory PGlite (see docs/specs/colleges/colleges.md)

type PrismaClient = import("@project/db").PrismaClient;
let prisma: PrismaClient;
let listColleges: typeof import("../../packages/domain/src/queries/colleges").listColleges;

beforeAll(async () => {
  process.env.PGLITE_DATA_DIR = "memory://";
  delete process.env.DATABASE_URL;
  prisma = (await import("@project/db")).prisma;
  ({ listColleges } = await import("../../packages/domain/src/queries/colleges"));

  await prisma.college.createMany({
    data: [
      { id: "queens", name: "Queens College", borough: "Queens" },
      { id: "baruch", name: "Baruch College", borough: "Manhattan" },
      { id: "lehman", name: "Lehman College", borough: "Bronx" },
    ],
  });
}, 30000);

const names = async (q?: string) => (await listColleges(q)).map((c) => c.name);

describe("listColleges", () => {
  it("lists every college A→Z", async () => {
    expect(await names()).toEqual(["Baruch College", "Lehman College", "Queens College"]);
  });

  it("returns only id, name and borough", async () => {
    const [first] = await listColleges();
    expect(first).toEqual({ id: "baruch", name: "Baruch College", borough: "Manhattan" });
  });

  it("filters by name, ignoring case", async () => {
    expect(await names("queens")).toEqual(["Queens College"]);
    expect(await names("BAR")).toEqual(["Baruch College"]);
  });

  it("treats a whitespace-only q as no filter", async () => {
    expect(await names("   ")).toHaveLength(3);
  });

  it("returns an empty list when nothing matches", async () => {
    expect(await names("harvard")).toEqual([]);
  });
});
