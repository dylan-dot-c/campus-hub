import { z } from "zod";

// empty since it wont be created manually by user
export const CreateProfile = z.object({});

export type CreateProfileInput = z.infer<typeof CreateProfile>;
