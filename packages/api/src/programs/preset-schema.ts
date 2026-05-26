import { z } from "zod";

export const PRESET_LEVELS = ["beginner", "intermediate", "advanced"] as const;
export type PresetLevel = typeof PRESET_LEVELS[number];

export const PRESET_GOALS = ["strength", "hypertrophy", "cardio", "bodyweight", "general"] as const;
export type PresetGoal = typeof PRESET_GOALS[number];

export const presetExerciseSchema = z.object({
  exerciseSlug: z.string().min(1),
  sets: z.number().int().positive(),
  repMin: z.number().int().positive().nullable(),
  repMax: z.number().int().positive().nullable(),
  restSeconds: z.number().int().nonnegative().nullable(),
  targetRpe: z.number().min(1).max(10).nullable(),
  target1rmPct: z.number().int().min(1).max(100).nullable(),
  tempo: z.string().nullable(),
  supersetGroup: z.number().int().nullable(),
  notes: z.string().nullable(),
});

export type PresetExercise = z.infer<typeof presetExerciseSchema>;

export const presetDaySchema = z.object({
  week: z.number().int().positive(),
  day: z.number().int().min(1).max(7),
  title: z.string().min(1),
  isRest: z.boolean().default(false),
  exercises: z.array(presetExerciseSchema).default([]),
  notes: z.string().nullable().optional(),
});

export type PresetDay = z.infer<typeof presetDaySchema>;

export const presetProgramSchema = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/),
  name: z.string().min(1),
  description: z.string(),
  authorCredit: z.string().nullable(),
  weeks: z.number().int().positive(),
  daysPerWeek: z.number().int().min(1).max(7),
  level: z.enum(PRESET_LEVELS),
  goal: z.enum(PRESET_GOALS),
  tags: z.array(z.string()).default([]),
  equipmentNeeded: z.array(z.string()).default([]),
  days: z.array(presetDaySchema),
}).superRefine((p, ctx) => {
  const expected = p.weeks * p.daysPerWeek;
  if (p.days.length !== expected) {
    ctx.addIssue({
      code: "custom",
      message: `days count ${p.days.length} != weeks*daysPerWeek (${expected})`,
      path: ["days"],
    });
  }
});

export type PresetProgram = z.infer<typeof presetProgramSchema>;
