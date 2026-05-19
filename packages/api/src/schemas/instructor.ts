import { z } from "zod";

export const instructorInsertSchema = z.object({
  name: z.string().min(1).max(120),
  email: z.string().email().max(256).optional(),
  phone: z
    .string()
    .regex(/^\+?[0-9]{7,15}$/u)
    .optional(),
  photoUrl: z.string().url().optional(),
  bio: z.string().max(2000).optional(),
});

export const instructorUpdateSchema = instructorInsertSchema.partial();

export type InstructorInsert = z.infer<typeof instructorInsertSchema>;
export type InstructorUpdate = z.infer<typeof instructorUpdateSchema>;
