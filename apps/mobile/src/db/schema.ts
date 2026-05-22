import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";

// Timestamps are ISO-8601 strings. Booleans are 0/1 integers.

export const exercises = sqliteTable("exercises", {
  id: text("id").primaryKey(),
  tenantId: text("tenant_id"),
  memberId: text("member_id"),
  slug: text("slug"),
  name: text("name").notNull(),
  primaryMuscle: text("primary_muscle").notNull(),
  equipment: text("equipment").notNull(),
  metric: text("metric").notNull().default("weight_reps"),
  defaultRestSec: integer("default_rest_sec").notNull().default(90),
  instructions: text("instructions"),
  imageUrl: text("image_url"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
  deletedAt: text("deleted_at"),
  syncStatus: text("sync_status").notNull().default("synced"),
  syncedAt: text("synced_at"),
});

export const memberExercisePrefs = sqliteTable("member_exercise_prefs", {
  id: text("id").primaryKey(),
  tenantId: text("tenant_id").notNull(),
  memberId: text("member_id").notNull(),
  exerciseId: text("exercise_id").notNull(),
  defaultRestSec: integer("default_rest_sec").notNull(),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
  syncStatus: text("sync_status").notNull().default("pending"),
});

export const workouts = sqliteTable("workouts", {
  id: text("id").primaryKey(),
  tenantId: text("tenant_id").notNull(),
  memberId: text("member_id").notNull(),
  title: text("title").notNull().default("Workout"),
  startedAt: text("started_at").notNull(),
  finishedAt: text("finished_at"),
  durationSec: integer("duration_sec").notNull().default(0),
  totalVolume: real("total_volume").notNull().default(0),
  notes: text("notes"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
  deletedAt: text("deleted_at"),
  syncStatus: text("sync_status").notNull().default("pending"),
  isActive: integer("is_active").notNull().default(0),
});

export const workoutSets = sqliteTable("workout_sets", {
  id: text("id").primaryKey(),
  workoutId: text("workout_id").notNull(),
  exerciseId: text("exercise_id").notNull(),
  orderIndex: integer("order_index").notNull(),
  setIndex: integer("set_index").notNull(),
  weight: real("weight"),
  reps: integer("reps"),
  durationSec: integer("duration_sec"),
  restSec: integer("rest_sec"),
  isWarmup: integer("is_warmup").notNull().default(0),
  isPr: integer("is_pr").notNull().default(0),
  createdAt: text("created_at").notNull(),
});

export type LocalExercise = typeof exercises.$inferSelect;
export type LocalWorkout = typeof workouts.$inferSelect;
export type LocalWorkoutSet = typeof workoutSets.$inferSelect;
export type LocalMemberExercisePref =
  typeof memberExercisePrefs.$inferSelect;
