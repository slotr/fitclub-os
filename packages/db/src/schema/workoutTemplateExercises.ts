import {
  index, integer, numeric, pgTable, text, uniqueIndex, uuid,
} from "drizzle-orm/pg-core";
import { id } from "./_helpers";
import { exercises } from "./exercises";
import { workoutTemplates } from "./workoutTemplates";

export const workoutTemplateExercises = pgTable(
  "workout_template_exercises",
  {
    id: id(),
    templateId: uuid("template_id")
      .notNull()
      .references(() => workoutTemplates.id, { onDelete: "cascade" }),
    exerciseId: uuid("exercise_id")
      .notNull()
      .references(() => exercises.id, { onDelete: "restrict" }),
    position: integer("position").notNull(),
    sets: integer("sets").notNull(),
    repMin: integer("rep_min"),
    repMax: integer("rep_max"),
    restSeconds: integer("rest_seconds"),
    targetRpe: numeric("target_rpe", { precision: 3, scale: 1 }),
    target1rmPct: integer("target_1rm_pct"),
    tempo: text("tempo"),
    supersetGroup: integer("superset_group"),
    notes: text("notes"),
  },
  (t) => ({
    templatePositionIdx: uniqueIndex("wte_template_position_uq")
      .on(t.templateId, t.position),
    templateIdx: index("wte_template_idx").on(t.templateId, t.position),
  }),
);

export type WorkoutTemplateExercise = typeof workoutTemplateExercises.$inferSelect;
export type NewWorkoutTemplateExercise = typeof workoutTemplateExercises.$inferInsert;
