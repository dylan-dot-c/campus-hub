import { describe, it, expect } from "vitest";
import { Student } from "../src/schemas/student";

describe("Student", () => {
  it("accepts a valid student", () => {
    expect(
      Student.safeParse({ email: "ana@baruch.cuny.edu", password: "hunter2hunter2" }).success
    ).toBe(true);
  });

  it("normalizes the email", () => {
    const parsed = Student.parse({ email: "  Ana@Baruch.CUNY.edu ", password: "hunter2hunter2" });
    expect(parsed.email).toBe("ana@baruch.cuny.edu");
  });

  it("rejects an invalid email", () => {
    expect(Student.safeParse({ email: "not-an-email", password: "hunter2hunter2" }).success).toBe(false);
  });

  it("accepts a cuny.edu email without a campus subdomain", () => {
    expect(Student.safeParse({ email: "ana@cuny.edu", password: "hunter2hunter2" }).success).toBe(true);
  });

  it("rejects a non-CUNY email", () => {
    expect(Student.safeParse({ email: "ana@gmail.com", password: "hunter2hunter2" }).success).toBe(false);
  });

  it("rejects lookalike domains", () => {
    for (const email of ["ana@notcuny.edu", "ana@cuny.edu.evil.com", "cuny.edu@gmail.com"]) {
      expect(Student.safeParse({ email, password: "hunter2hunter2" }).success).toBe(false);
    }
  });

  it("rejects a password under 8 characters", () => {
    expect(Student.safeParse({ email: "ana@baruch.cuny.edu", password: "short" }).success).toBe(false);
  });

  it("rejects a password over 128 characters", () => {
    expect(
      Student.safeParse({ email: "ana@baruch.cuny.edu", password: "a".repeat(129) }).success
    ).toBe(false);
  });

  it("rejects missing password", () => {
    expect(Student.safeParse({ email: "ana@baruch.cuny.edu" }).success).toBe(false);
  });

  it("rejects the wrong type", () => {
    expect(Student.safeParse({ email: 42, password: "hunter2hunter2" }).success).toBe(false);
  });
});
