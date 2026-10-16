import { z } from "zod";

export const Post = z.object({
  title: z.string().trim().min(1, "Title is required").max(120),
  content: z.string().trim().max(5000, "Max Limit Reached"),
});

export type CreatePostInput = z.infer<typeof Post>;

