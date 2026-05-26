import { z } from "zod";

export const templateExerciseInputSchema = z.object({
  exerciseId: z.string().uuid(),
  position: z.number().int().nonnegative(),
  sets: z.number().int().positive(),
  repMin: z.number().int().positive().nullable().default(null),
  repMax: z.number().int().positive().nullable().default(null),
  restSeconds: z.number().int().nonnegative().nullable().default(null),
  targetRpe: z.number().min(1).max(10).nullable().default(null),
  target1rmPct: z.number().int().min(1).max(100).nullable().default(null),
  tempo: z.string().max(20).nullable().default(null),
  supersetGroup: z.number().int().min(0).nullable().default(null),
  notes: z.string().max(500).nullable().default(null),
}).superRefine((v, ctx) => {
  if (v.repMin != null && v.repMax != null && v.repMax < v.repMin) {
    ctx.addIssue({
      code: "custom",
      message: "repMax must be >= repMin",
      path: ["repMax"],
    });
  }
});

export type TemplateExerciseInput = z.infer<typeof templateExerciseInputSchema>;

export const workoutTemplateInputSchema = z.object({
  name: z.string().min(1).max(120),
  description: z.string().max(2000).nullable().optional(),
  estimatedMin: z.number().int().positive().nullable().optional(),
  exercises: z.array(templateExerciseInputSchema).min(1, "at least one exercise required"),
});

export type WorkoutTemplateInput = z.infer<typeof workoutTemplateInputSchema>;
