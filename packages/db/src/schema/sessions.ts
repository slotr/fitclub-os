import {
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { createdAt, id } from "./_helpers";
import { classes } from "./classes";
import { instructors } from "./instructors";
import { tenants } from "./tenants";

export const sessionStatusEnum = pgEnum("session_status", [
  "scheduled",
  "cancelled",
  "completed",
]);

export const sessions = pgTable(
  "sessions",
  {
    id: id(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "restrict" }),
    classId: uuid("class_id")
      .notNull()
      .references(() => classes.id, { onDelete: "restrict" }),
    instructorId: uuid("instructor_id").references(() => instructors.id, {
      onDelete: "set null",
    }),
    startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
    endsAt: timestamp("ends_at", { withTimezone: true }).notNull(),
    capacity: integer("capacity").notNull(),
    room: varchar("room", { length: 64 }),
    status: sessionStatusEnum("status").notNull().default("scheduled"),
    notes: text("notes"),
    createdAt: createdAt(),
  },
  (t) => ({
    tenantStartsIdx: index("sessions_tenant_starts_idx").on(
      t.tenantId,
      t.startsAt,
    ),
  }),
);

export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;
