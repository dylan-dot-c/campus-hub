import { z } from "zod";

export const Student = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Invalid email")
    // cuny.edu or any subdomain (e.g. baruch.cuny.edu) — not notcuny.edu
    .regex(/@([a-z0-9-]+\.)*cuny\.edu$/, "Use your CUNY email (ending in cuny.edu)"),
  password: z.string().min(8, "Password must be at least 8 characters").max(128),
});

export type CreateStudentInput = z.infer<typeof Student>;

// sign-in normalizes email the same way as signup, but skips the CUNY check —
// a non-CUNY email simply matches no account
// TODO: later, sign-in will also require a .edu email, like signup does
export const SignIn = z.object({
  email: z.string().trim().toLowerCase().min(1, "Email is required"),
  password: z.string().min(1, "Password is required").max(128),
});

export type SignInInput = z.infer<typeof SignIn>;
