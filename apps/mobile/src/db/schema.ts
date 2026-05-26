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
  templateId: text("template_id"),
  programDayId: text("program_day_id"),
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
  plannedRepMin: integer("planned_rep_min"),
  plannedRepMax: integer("planned_rep_max"),
  plannedRestSec: integer("planned_rest_sec"),
  plannedRpe: real("planned_rpe"),
  planned1rmPct: integer("planned_1rm_pct"),
  supersetGroup: integer("superset_group"),
  isComplete: integer("is_complete").notNull().default(0),
});

export type LocalExercise = typeof exercises.$inferSelect;
export type LocalWorkout = typeof workouts.$inferSelect;
export type LocalWorkoutSet = typeof workoutSets.$inferSelect;
export type LocalMemberExercisePref =
  typeof memberExercisePrefs.$inferSelect;

export const workoutTemplates = sqliteTable("workout_templates", {
  id: text("id").primaryKey(),
  tenantId: text("tenant_id").notNull(),
  memberId: text("member_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  estimatedMin: integer("estimated_min"),
  sourcePreset: text("source_preset"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
  deletedAt: text("deleted_at"),
  syncStatus: text("sync_status").notNull().default("pending"),
  syncedAt: text("synced_at"),
});

export const workoutTemplateExercises = sqliteTable("workout_template_exercises", {
  id: text("id").primaryKey(),
  templateId: text("template_id").notNull(),
  exerciseId: text("exercise_id").notNull(),
  position: integer("position").notNull(),
  sets: integer("sets").notNull(),
  repMin: integer("rep_min"),
  repMax: integer("rep_max"),
  restSeconds: integer("rest_seconds"),
  targetRpe: real("target_rpe"),
  target1rmPct: integer("target_1rm_pct"),
  tempo: text("tempo"),
  supersetGroup: integer("superset_group"),
  notes: text("notes"),
  syncStatus: text("sync_status").notNull().default("pending"),
});

export const programs = sqliteTable("programs", {
  id: text("id").primaryKey(),
  tenantId: text("tenant_id").notNull(),
  memberId: text("member_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  weeksCount: integer("weeks_count").notNull(),
  daysPerWeek: integer("days_per_week").notNull(),
  status: text("status").notNull().default("draft"),
  currentPosition: integer("current_position").notNull().default(0),
  sourcePreset: text("source_preset"),
  startedAt: text("started_at"),
  completedAt: text("completed_at"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
  deletedAt: text("deleted_at"),
  syncStatus: text("sync_status").notNull().default("pending"),
  syncedAt: text("synced_at"),
});

export const programDays = sqliteTable("program_days", {
  id: text("id").primaryKey(),
  programId: text("program_id").notNull(),
  week: integer("week").notNull(),
  day: integer("day").notNull(),
  position: integer("position").notNull(),
  title: text("title").notNull(),
  templateId: text("template_id"),
  isRest: integer("is_rest").notNull().default(0),
  notes: text("notes"),
  syncStatus: text("sync_status").notNull().default("pending"),
});

export const programDayCompletions = sqliteTable("program_day_completions", {
  id: text("id").primaryKey(),
  programId: text("program_id").notNull(),
  programDayId: text("program_day_id").notNull(),
  memberId: text("member_id").notNull(),
  workoutId: text("workout_id"),
  completedAt: text("completed_at").notNull(),
  syncStatus: text("sync_status").notNull().default("pending"),
});

export type LocalWorkoutTemplate = typeof workoutTemplates.$inferSelect;
export type LocalWorkoutTemplateExercise = typeof workoutTemplateExercises.$inferSelect;
export type LocalProgram = typeof programs.$inferSelect;
export type LocalProgramDay = typeof programDays.$inferSelect;
export type LocalProgramDayCompletion = typeof programDayCompletions.$inferSelect;
