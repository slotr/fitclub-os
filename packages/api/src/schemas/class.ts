import { z } from "zod";

export const classCategorySchema = z.enum([
  "yoga",
  "cross",
  "pilates",
  "strength",
  "cardio",
  "pt",
]);

export const classInsertSchema = z.object({
  name: z.string().min(1).max(120),
  category: classCategorySchema,
  defaultDurationMin: z.coerce.number().int().min(5).max(480),
  defaultCapacity: z.coerce.number().int().min(1).max(500),
  room: z.string().max(64).optional(),
  color: z.string().max(16).optional(),
});

export const classUpdateSchema = classInsertSchema.partial();

export type ClassCategory = z.infer<typeof classCategorySchema>;
export type ClassInsert = z.infer<typeof classInsertSchema>;
export type ClassUpdate = z.infer<typeof classUpdateSchema>;
