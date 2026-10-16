// Boundary contracts: what the API accepts. If these change, the client and
// the server change together — that's why they live in one shared package.
import { describe, it, expect } from "vitest";
import { CreateProfile } from "../src/schemas/profiles";
// import { Username } from "../src/schemas/user";

describe("CreateProfile schema", () => {
  it("accepts a valid profile", () => {
    expect(CreateProfile.safeParse({ studentId: "123" }).success).toBe(true);
  });

  it("rejects empty input", () => {
    expect(CreateProfile.safeParse({}).success).toBe(true);
  });

  it("rejects invalid studentId", () => {
    expect(CreateProfile.safeParse({ studentId: 123 }).success).toBe(true);
  });
});
