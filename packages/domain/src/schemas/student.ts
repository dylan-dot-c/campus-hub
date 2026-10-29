import { z } from "zod";

export const Student = z.object({
  email: z.string().trim().toLowerCase().email("Invalid email"),
  password: z.string().min(8, "Password must be at least 8 characters").max(128),
});

export type CreateStudentInput = z.infer<typeof Student>;
