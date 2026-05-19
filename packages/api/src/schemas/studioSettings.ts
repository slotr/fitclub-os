import { z } from "zod";

export const studioHoursSchema = z.object({
  day: z.string().min(1).max(16),
  open: z.string().regex(/^\d{2}:\d{2}$/u, "Expected HH:MM"),
  close: z.string().regex(/^\d{2}:\d{2}$/u, "Expected HH:MM"),
});

export const studioSettingsInsertSchema = z.object({
  name: z.string().min(1).max(120),
  timezone: z.string().min(1).max(64).default("Europe/Istanbul"),
  locale: z.string().min(2).max(16).default("en"),
  currency: z.string().length(3).default("TRY"),
  accentColor: z.string().max(16).nullable().optional(),
  hours: z.array(studioHoursSchema).default([]),
  integrations: z.record(z.unknown()).default({}),
});

export const studioSettingsUpdateSchema = studioSettingsInsertSchema.partial();

export type StudioHours = z.infer<typeof studioHoursSchema>;
export type StudioSettingsInsert = z.infer<typeof studioSettingsInsertSchema>;
export type StudioSettingsUpdate = z.infer<typeof studioSettingsUpdateSchema>;
