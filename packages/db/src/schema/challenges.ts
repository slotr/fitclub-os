import {
  index,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { createdAt, deletedAt, id, updatedAt } from "./_helpers";
import { exercises } from "./exercises";
import { tenants } from "./tenants";
import { challengeMetricType, challengeStatus } from "./challengeEnums";

export const challenges = pgTable(
  "challenges",
  {
    id: id(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 120 }).notNull(),
    description: text("description"),
    metricType: challengeMetricType("metric_type").notNull(),
    exerciseId: uuid("exercise_id").references(() => exercises.id, {
      onDelete: "restrict",
    }),
    startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
    endsAt: timestamp("ends_at", { withTimezone: true }).notNull(),
    status: challengeStatus("status").notNull().default("draft"),
    createdBy: uuid("created_by"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
    deletedAt: deletedAt(),
  },
  (t) => ({
    tenantStatusIdx: index("challenges_tenant_status_idx").on(
      t.tenantId,
      t.status,
    ),
    tenantDatesIdx: index("challenges_tenant_dates_idx").on(
      t.tenantId,
      t.startsAt,
      t.endsAt,
    ),
  }),
);

export type Challenge = typeof challenges.$inferSelect;
export type NewChallenge = typeof challenges.$inferInsert;
