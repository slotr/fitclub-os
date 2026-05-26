import {
  index, integer, pgTable, text, timestamp, uuid, varchar,
} from "drizzle-orm/pg-core";
import { createdAt, deletedAt, id, updatedAt } from "./_helpers";
import { members } from "./members";
import { programStatus } from "./programStatus";
import { tenants } from "./tenants";

export const programs = pgTable(
  "programs",
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
    weeksCount: integer("weeks_count").notNull(),
    daysPerWeek: integer("days_per_week").notNull(),
    status: programStatus("status").notNull().default("draft"),
    currentPosition: integer("current_position").notNull().default(0),
    sourcePreset: varchar("source_preset", { length: 80 }),
    startedAt: timestamp("started_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
    deletedAt: deletedAt(),
  },
  (t) => ({
    memberIdx: index("programs_member_idx").on(t.memberId, t.status, t.deletedAt),
    tenantIdx: index("programs_tenant_idx").on(t.tenantId),
  }),
);
