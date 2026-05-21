import { integer, pgTable, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { createdAt, id, updatedAt } from "./_helpers";
import { exercises } from "./exercises";
import { members } from "./members";
import { tenants } from "./tenants";

export const memberExercisePrefs = pgTable(
  "member_exercise_prefs",
  {
    id: id(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    memberId: uuid("member_id")
      .notNull()
      .references(() => members.id, { onDelete: "cascade" }),
    exerciseId: uuid("exercise_id")
      .notNull()
      .references(() => exercises.id, { onDelete: "cascade" }),
    defaultRestSec: integer("default_rest_sec").notNull(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => ({
    memberExerciseIdx: uniqueIndex("member_exercise_prefs_unique_idx").on(
      t.memberId,
      t.exerciseId,
    ),
  }),
);

export type MemberExercisePref = typeof memberExercisePrefs.$inferSelect;
export type NewMemberExercisePref = typeof memberExercisePrefs.$inferInsert;
