import { describe, it, expect } from "vitest";
import { Post } from "../src/schemas/post";

describe("Post", () => {
  it("accepts a valid post", () => {
    expect(
      Post.safeParse({ title: "First week", content: "Where's the library?" }).success
    ).toBe(true);
  });

  it("rejects an empty title", () => {
    expect(Post.safeParse({ title: "   ", content: "Hello" }).success).toBe(false);
  });

  it("rejects missing content", () => {
    expect(Post.safeParse({ title: "First week" }).success).toBe(false);
  });

  it("rejects the wrong type", () => {
    expect(Post.safeParse({ title: 42, content: "Hello" }).success).toBe(false);
  });
});