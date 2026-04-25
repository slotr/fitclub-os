import { z } from "zod";

export const createMemberInput = z.object({
  email: z.string().email(),
  fullName: z.string().min(1).max(120),
  phone: z
    .string()
    .regex(/^\+?[0-9]{7,15}$/u)
    .optional(),
  birthdate: z.string().date().optional(),
  gender: z.enum(["male", "female", "other"]).optional(),
});

export const updateMemberInput = createMemberInput.partial();

export type CreateMemberInput = z.infer<typeof createMemberInput>;
export type UpdateMemberInput = z.infer<typeof updateMemberInput>;
