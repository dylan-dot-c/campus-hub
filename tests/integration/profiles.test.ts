import { beforeAll, describe, expect, it, vi } from "vitest";

const identity = vi.hoisted(() => ({ id: "profile-owner" }));
vi.mock("../../packages/auth/src/current-user", () => ({ currentUserId: async () => identity.id }));
vi.mock("../../apps/web/node_modules/next/cache.js", () => ({ revalidatePath: vi.fn() }));

type PrismaClient = import("@project/db").PrismaClient;
let prisma: PrismaClient;
let patch: typeof import("../../apps/web/app/api/profiles/me/route").PATCH;
let getProfile: typeof import("../../packages/domain/src/queries/profiles").getProfile;

beforeAll(async () => {
  process.env.PGLITE_DATA_DIR = "memory://";
  delete process.env.DATABASE_URL;
  prisma = (await import("@project/db")).prisma;
  ({ getProfile } = await import("../../packages/domain/src/queries/profiles"));
  ({ PATCH: patch } = await import("../../apps/web/app/api/profiles/me/route"));
  await prisma.student.create({ data: { id: "profile-owner", email: "owner@cuny.edu", passwordHash: "test", profile: { create: {} } } });
  await prisma.student.create({ data: { id: "profile-other", email: "other@cuny.edu", passwordHash: "test", profile: { create: { description: "Private edits" } } } });
  await prisma.college.create({ data: { id: "profile-college", name: "Test college" } });
}, 30000);

const request = (body: unknown) => new Request("http://localhost/api/profiles/me", {
  method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
});

describe("profile editing endpoint", () => {
  it("persists all fields for the current student without adding a profile", async () => {
    identity.id = "profile-owner";
    const response = await patch(request({ description: " Updated ", linkedin: "https://linkedin.com/in/ana", github: "https://github.com/ana", profileUrl: "https://example.test/avatar", collegeId: "profile-college" }));
    expect(response.status).toBe(200);
    expect(await getProfile(identity.id)).toMatchObject({ description: "Updated", linkedin: "https://linkedin.com/in/ana", github: "https://github.com/ana", profileUrl: "https://example.test/avatar", collegeId: "profile-college" });
    expect(await prisma.profile.count()).toBe(2);
    expect((await getProfile("profile-other"))?.description).toBe("Private edits");
    expect(await response.json()).not.toHaveProperty("profile.student");
  });
  it("clears supplied fields and preserves omitted ones", async () => {
    identity.id = "profile-owner";
    await patch(request({ description: "Keep", github: "https://github.com/ana" }));
    const response = await patch(request({ github: "", collegeId: null }));
    expect(response.status).toBe(200);
    expect(await getProfile(identity.id)).toMatchObject({ description: "Keep", github: null, collegeId: null });
  });
  it("rejects identity injection and invalid URLs without writing", async () => {
    identity.id = "profile-owner";
    for (const body of [{ studentId: "profile-other", description: "Hacked" }, { github: "bad" }]) {
      const response = await patch(request(body));
      expect(response.status).toBe(400);
      expect(await response.json()).toMatchObject({ error: { code: "VALIDATION" } });
    }
    expect((await getProfile("profile-other"))?.description).toBe("Private edits");
  });
  it("maps malformed JSON", async () => {
    identity.id = "profile-owner";
    const response = await patch(new Request("http://localhost/api/profiles/me", { method: "PATCH", body: "{" }));
    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({ error: { code: "BAD_JSON" } });
  });
  it("rejects unknown colleges without partially saving", async () => {
    identity.id = "profile-owner";
    const before = await getProfile(identity.id);
    const response = await patch(request({ description: "Must not save", collegeId: "missing" }));
    expect(response.status).toBe(404);
    expect(await getProfile(identity.id)).toEqual(before);
  });
  it("returns 404 for a missing current profile without touching another student", async () => {
    identity.id = "missing";
    const response = await patch(request({ description: "Must not save" }));
    expect(response.status).toBe(404);
    expect((await getProfile("profile-other"))?.description).toBe("Private edits");
  });
  it("rejects missing identity", async () => {
    identity.id = "";
    expect((await patch(request({ description: "No" }))).status).toBe(401);
  });
  it("does not expose unexpected database errors", async () => {
    identity.id = "profile-owner";
    const spy = vi.spyOn(prisma.profile, "update").mockRejectedValueOnce(new Error("secret database detail"));
    try {
      const response = await patch(request({ description: "No" }));
      expect(response.status).toBe(500);
      expect(await response.json()).toEqual({ error: { code: "INTERNAL_ERROR", message: "Could not save profile. Try again." } });
    } finally { spy.mockRestore(); }
  });
});
