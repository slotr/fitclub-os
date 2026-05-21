import {
  index,
  integer,
  pgTable,
  text,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { createdAt, deletedAt, id, updatedAt } from "./_helpers";
import { members } from "./members";
import { tenants } from "./tenants";
import { equipmentEnum, exerciseMetricEnum, muscleEnum } from "./workoutEnums";

// A row with tenantId+memberId NULL is a global seed exercise.
// A row with both set is a member-created custom exercise.
export const exercises = pgTable(
  "exercises",
  {
    id: id(),
    tenantId: uuid("tenant_id").references(() => tenants.id, {
      onDelete: "cascade",
    }),
    memberId: uuid("member_id").references(() => members.id, {
      onDelete: "cascade",
    }),
    slug: varchar("slug", { length: 96 }),
    name: text("name").notNull(),
    primaryMuscle: muscleEnum("primary_muscle").notNull(),
    equipment: equipmentEnum("equipment").notNull(),
    metric: exerciseMetricEnum("metric").notNull().default("weight_reps"),
    defaultRestSec: integer("default_rest_sec").notNull().default(90),
    instructions: text("instructions"),
    imageUrl: text("image_url"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
    deletedAt: deletedAt(),
  },
  (t) => ({
    globalSlugIdx: uniqueIndex("exercises_global_slug_idx").on(t.slug),
    memberIdx: index("exercises_member_idx").on(t.memberId),
  }),
);

export type Exercise = typeof exercises.$inferSelect;
export type NewExercise = typeof exercises.$inferInsert;
