import { sql } from "drizzle-orm";
import {
  index,
  pgEnum,
  pgTable,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { createdAt, id } from "./_helpers";
import { members } from "./members";
import { sessions } from "./sessions";
import { tenants } from "./tenants";

export const bookingStatusEnum = pgEnum("booking_status", [
  "booked",
  "cancelled",
  "attended",
  "no_show",
]);

export const bookings = pgTable(
  "bookings",
  {
    id: id(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "restrict" }),
    sessionId: uuid("session_id")
      .notNull()
      .references(() => sessions.id, { onDelete: "cascade" }),
    memberId: uuid("member_id")
      .notNull()
      .references(() => members.id, { onDelete: "cascade" }),
    status: bookingStatusEnum("status").notNull().default("booked"),
    bookedAt: timestamp("booked_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
    cancelledAt: timestamp("cancelled_at", { withTimezone: true }),
    createdAt: createdAt(),
  },
  (t) => ({
    sessionMemberUnique: uniqueIndex("bookings_session_member_uniq").on(
      t.sessionId,
      t.memberId,
    ),
    tenantMemberIdx: index("bookings_tenant_member_idx").on(
      t.tenantId,
      t.memberId,
    ),
  }),
);

export type Booking = typeof bookings.$inferSelect;
export type NewBooking = typeof bookings.$inferInsert;
