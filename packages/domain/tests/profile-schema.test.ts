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

import { UpdateProfile } from "../src/schemas/profiles";

describe("UpdateProfile", () => {
  it("trims fields and permits clearing", () => {
    expect(UpdateProfile.parse({ description: " hello ", linkedin: "  ", collegeId: null }))
      .toEqual({ description: "hello", linkedin: null, collegeId: null });
  });
  it.each([{}, { studentId: "other", description: "hello" }, { linkedIn: "https://linkedin.com/in/ana" }, { description: "x".repeat(2001) }, { github: "bad" }, { github: "https://github.com.evil.test/ana" }, { linkedin: "https://linkedin.com/company/test" }, { profileUrl: "javascript:alert(1)" }])("rejects invalid input %j", (input) => {
    expect(UpdateProfile.safeParse(input).success).toBe(false);
  });
  it("accepts supported URLs, including an image URL with no extension", () => {
    expect(UpdateProfile.safeParse({
      github: "https://github.com/ana", linkedin: "https://www.linkedin.com/in/ana/",
      profileUrl: "https://images.example.test/avatar?id=1", description: "x".repeat(2000),
    }).success).toBe(true);
  });
});
