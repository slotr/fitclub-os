import {
  index,
  pgTable,
  text,
  integer,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { createdAt, deletedAt, id, updatedAt } from "./_helpers";
import { tenants } from "./tenants";
import { members } from "./members";

export const workoutTemplates = pgTable(
  "workout_templates",
  {
    id: id(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    memberId: uuid("member_id")
      .notNull()
      .references(() => members.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 120 }).notNull(),
    description: text("description"),
    estimatedMin: integer("estimated_min"),
    sourcePreset: varchar("source_preset", { length: 80 }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
    deletedAt: deletedAt(),
  },
  (t) => ({
    memberIdx: index("workout_templates_member_idx").on(t.memberId, t.deletedAt),
    tenantIdx: index("workout_templates_tenant_idx").on(t.tenantId),
  }),
);

export type WorkoutTemplate = typeof workoutTemplates.$inferSelect;
export type NewWorkoutTemplate = typeof workoutTemplates.$inferInsert;
