import { z } from "zod";

export const sessionStatusSchema = z.enum([
  "scheduled",
  "cancelled",
  "completed",
]);

export const sessionInsertSchema = z
  .object({
    classId: z.string().uuid(),
    instructorId: z.string().uuid().optional(),
    startsAt: z.coerce.date(),
    endsAt: z.coerce.date(),
    capacity: z.coerce.number().int().min(1).max(500),
    room: z.string().max(64).optional(),
    status: sessionStatusSchema.default("scheduled"),
    notes: z.string().max(2000).optional(),
  })
  .refine((v) => v.endsAt > v.startsAt, {
    message: "endsAt must be after startsAt",
    path: ["endsAt"],
  });

export const sessionUpdateSchema = z
  .object({
    classId: z.string().uuid().optional(),
    instructorId: z.string().uuid().nullable().optional(),
    startsAt: z.coerce.date().optional(),
    endsAt: z.coerce.date().optional(),
    capacity: z.coerce.number().int().min(1).max(500).optional(),
    room: z.string().max(64).nullable().optional(),
    status: sessionStatusSchema.optional(),
    notes: z.string().max(2000).nullable().optional(),
  })
  .refine(
    (v) => !v.startsAt || !v.endsAt || v.endsAt > v.startsAt,
    { message: "endsAt must be after startsAt", path: ["endsAt"] },
  );

export type SessionStatus = z.infer<typeof sessionStatusSchema>;
export type SessionInsert = z.infer<typeof sessionInsertSchema>;
export type SessionUpdate = z.infer<typeof sessionUpdateSchema>;
