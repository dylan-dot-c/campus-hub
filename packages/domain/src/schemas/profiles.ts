import { z } from "zod";

// empty since it wont be created manually by user
export const CreateProfile = z.object({});

export type CreateProfileInput = z.infer<typeof CreateProfile>;

const nullableText = <T extends z.ZodTypeAny>(schema: T) =>
  z.union([z.string().trim().length(0).transform(() => null), schema, z.null()]);

function profileUrl(hosts: string[], path: RegExp, label: string) {
  return z.string().trim().max(2048).url().refine((value) => {
    try {
      const url = new URL(value);
      return ["http:", "https:"].includes(url.protocol)
        && hosts.includes(url.hostname) && path.test(url.pathname);
    } catch { return false; }
  }, `Enter a valid ${label} profile URL`);
}

export const UpdateProfile = z.object({
  description: nullableText(z.string().trim().max(2000)).optional(),
  linkedin: nullableText(profileUrl(["linkedin.com", "www.linkedin.com"], /^\/in\/[^/]+\/?$/, "LinkedIn")).optional(),
  github: nullableText(profileUrl(["github.com", "www.github.com"], /^\/[^/]+\/?$/, "GitHub")).optional(),
  profileUrl: nullableText(z.string().trim().max(2048).url().refine((value) =>
    /^https?:\/\//i.test(value), "Use an HTTP or HTTPS URL")).optional(),
  collegeId: nullableText(z.string().trim().min(1)).optional(),
}).strict().refine((value) => Object.values(value).some((field) => field !== undefined), {
  message: "Supply at least one profile field",
});

export type UpdateProfileInput = z.infer<typeof UpdateProfile>;
