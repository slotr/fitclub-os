import { pgEnum } from "drizzle-orm/pg-core";

export const muscleEnum = pgEnum("muscle_group", [
  "chest",
  "back",
  "shoulders",
  "biceps",
  "triceps",
  "legs",
  "glutes",
  "core",
  "fullBody",
]);

export const equipmentEnum = pgEnum("equipment", [
  "barbell",
  "dumbbell",
  "machine",
  "cable",
  "bodyweight",
  "kettlebell",
  "band",
  "other",
]);

export const exerciseMetricEnum = pgEnum("exercise_metric", [
  "weight_reps",
  "reps_only",
  "time",
]);
