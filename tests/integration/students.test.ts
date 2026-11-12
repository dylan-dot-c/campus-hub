import { beforeAll, describe, expect, it } from "vitest";

type PrismaClient = import("@project/db").PrismaClient;
let prisma: PrismaClient;
let createStudent: typeof import("../../packages/domain/src/queries/students").createStudent;

beforeAll(async () => {
  process.env.PGLITE_DATA_DIR = "memory://";
  delete process.env.DATABASE_URL;
  prisma = (await import("@project/db")).prisma;
  ({ createStudent } = await import("../../packages/domain/src/queries/students"));
}, 30000);

describe("signup with a profile", () => {
  it("creates one linked empty profile and returns only safe account fields", async () => {
    const student = await createStudent({
      email: "profile@baruch.cuny.edu",
      password: "test-password",
    });

    expect(Object.keys(student).sort()).toEqual([
      "createdAt", "email", "id", "updatedAt",
    ]);
    expect(await prisma.profile.findMany({ where: { studentId: student.id } }))
      .toEqual([{
        studentId: student.id,
        description: null,
        linkedin: null,
        github: null,
        profileUrl: null,
        collegeId: null,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      }]);
  });

  it("does not add records when the email already exists", async () => {
    const input = { email: "duplicate@baruch.cuny.edu", password: "test-password" };
    await createStudent(input);
    const students = await prisma.student.count();
    const profiles = await prisma.profile.count();

    await expect(createStudent(input)).rejects.toMatchObject({ code: "P2002" });

    expect(await prisma.student.count()).toBe(students);
    expect(await prisma.profile.count()).toBe(profiles);
  });

  it("rolls back the student when the database rejects profile creation", async () => {
    const students = await prisma.student.count();
    const profiles = await prisma.profile.count();
    await prisma.$executeRawUnsafe(`
      CREATE FUNCTION reject_signup_profile() RETURNS trigger AS $$
      BEGIN
        RAISE EXCEPTION 'Profile creation deliberately rejected by test';
      END;
      $$ LANGUAGE plpgsql
    `);
    await prisma.$executeRawUnsafe(`
      CREATE TRIGGER reject_signup_profile BEFORE INSERT ON "Profile"
      FOR EACH ROW EXECUTE FUNCTION reject_signup_profile()
    `);

    try {
      await expect(createStudent({
        email: "rollback@baruch.cuny.edu",
        password: "test-password",
      })).rejects.toThrow();

      expect(await prisma.student.findUnique({
        where: { email: "rollback@baruch.cuny.edu" },
        select: { id: true },
      })).toBeNull();
      expect(await prisma.student.count()).toBe(students);
      expect(await prisma.profile.count()).toBe(profiles);
    } finally {
      await prisma.$executeRawUnsafe('DROP TRIGGER reject_signup_profile ON "Profile"');
      await prisma.$executeRawUnsafe('DROP FUNCTION reject_signup_profile()');
    }
  });
});
