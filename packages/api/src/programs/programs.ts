import { z } from "zod";
import { templateExerciseInputSchema } from "./templates";

export const PROGRAM_STATUSES = ["draft", "active", "paused", "completed"] as const;
export type ProgramStatus = typeof PROGRAM_STATUSES[number];

export const programInputSchema = z.object({
  name: z.string().min(1).max(120),
  description: z.string().max(2000).nullable().optional(),
  weeksCount: z.number().int().positive().max(52),
  daysPerWeek: z.number().int().min(1).max(7),
});

export type ProgramInput = z.infer<typeof programInputSchema>;

export const programDayInputSchema = z.object({
  week: z.number().int().positive(),
  day: z.number().int().min(1).max(7),
  position: z.number().int().nonnegative(),
  title: z.string().min(1).max(120),
  templateId: z.string().uuid().nullable(),
  isRest: z.boolean(),
  notes: z.string().max(500).nullable().optional(),
}).superRefine((v, ctx) => {
  if (!v.isRest && v.templateId == null) {
    ctx.addIssue({
      code: "custom",
      message: "non-rest day requires templateId",
      path: ["templateId"],
    });
  }
});

export type ProgramDayInput = z.infer<typeof programDayInputSchema>;

// Re-export template schemas so a single import covers both
export { templateExerciseInputSchema, workoutTemplateInputSchema } from "./templates";
export type { TemplateExerciseInput, WorkoutTemplateInput } from "./templates";
