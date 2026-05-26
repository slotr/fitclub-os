import {
  index,
  integer,
  numeric,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { createdAt, deletedAt, id, updatedAt } from "./_helpers";
import { members } from "./members";
import { tenants } from "./tenants";
import { workoutTemplates } from "./workoutTemplates";
import { programDays } from "./programDays";

export const workouts = pgTable(
  "workouts",
  {
    id: id(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    memberId: uuid("member_id")
      .notNull()
      .references(() => members.id, { onDelete: "cascade" }),
    title: text("title").notNull().default("Workout"),
    startedAt: timestamp("started_at", { withTimezone: true }).notNull(),
    finishedAt: timestamp("finished_at", { withTimezone: true }),
    durationSec: integer("duration_sec").notNull().default(0),
    totalVolume: numeric("total_volume").notNull().default("0"),
    notes: text("notes"),
    templateId: uuid("template_id")
      .references((): any => workoutTemplates.id, { onDelete: "set null" }),
    programDayId: uuid("program_day_id")
      .references((): any => programDays.id, { onDelete: "set null" }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
    deletedAt: deletedAt(),
  },
  (t) => ({
    memberTimeIdx: index("workouts_member_time_idx").on(
      t.memberId,
      t.startedAt,
    ),
  }),
);

export type Workout = typeof workouts.$inferSelect;
export type NewWorkout = typeof workouts.$inferInsert;
