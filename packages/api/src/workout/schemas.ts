import { z } from "zod";

export const workoutSetInputSchema = z.object({
  exerciseId: z.string().min(1),
  orderIndex: z.number().int().min(0),
  setIndex: z.number().int().min(0),
  weight: z.number().min(0).nullable().optional(),
  reps: z.number().int().min(0).nullable().optional(),
  durationSec: z.number().int().min(0).nullable().optional(),
  restSec: z.number().int().min(0).nullable().optional(),
  isWarmup: z.boolean().default(false),
});

export const customExerciseInputSchema = z.object({
  name: z.string().min(1).max(120),
  primaryMuscle: z.enum([
    "chest", "back", "shoulders", "biceps", "triceps",
    "legs", "glutes", "core", "fullBody",
  ]),
  equipment: z.enum([
    "barbell", "dumbbell", "machine", "cable",
    "bodyweight", "kettlebell", "band", "other",
  ]),
  metric: z.enum(["weight_reps", "reps_only", "time"]),
  defaultRestSec: z.number().int().min(5).max(900).default(90),
});

export const BACKUP_VERSION = 1;

export const backupFileSchema = z.object({
  version: z.literal(BACKUP_VERSION),
  exportedAt: z.string(),
  memberId: z.string(),
  exercises: z.array(z.record(z.unknown())),
  memberPrefs: z.array(z.record(z.unknown())),
  workouts: z.array(z.record(z.unknown())),
  sets: z.array(z.record(z.unknown())),
});

export type WorkoutSetInput = z.infer<typeof workoutSetInputSchema>;
export type CustomExerciseInput = z.infer<typeof customExerciseInputSchema>;
export type BackupFile = z.infer<typeof backupFileSchema>;
