import {
  boolean,
  index,
  integer,
  numeric,
  pgTable,
  uuid,
} from "drizzle-orm/pg-core";
import { createdAt, id } from "./_helpers";
import { exercises } from "./exercises";
import { workouts } from "./workouts";

export const workoutSets = pgTable(
  "workout_sets",
  {
    id: id(),
    workoutId: uuid("workout_id")
      .notNull()
      .references(() => workouts.id, { onDelete: "cascade" }),
    exerciseId: uuid("exercise_id")
      .notNull()
      .references(() => exercises.id, { onDelete: "restrict" }),
    orderIndex: integer("order_index").notNull(),
    setIndex: integer("set_index").notNull(),
    weight: numeric("weight"),
    reps: integer("reps"),
    durationSec: integer("duration_sec"),
    restSec: integer("rest_sec"),
    isWarmup: boolean("is_warmup").notNull().default(false),
    isPr: boolean("is_pr").notNull().default(false),
    createdAt: createdAt(),
  },
  (t) => ({
    workoutIdx: index("workout_sets_workout_idx").on(t.workoutId),
    exerciseIdx: index("workout_sets_exercise_idx").on(t.exerciseId),
  }),
);

export type WorkoutSet = typeof workoutSets.$inferSelect;
export type NewWorkoutSet = typeof workoutSets.$inferInsert;
