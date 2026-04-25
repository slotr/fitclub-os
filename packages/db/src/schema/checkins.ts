import { sql } from "drizzle-orm";
import {
  index,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { createdAt, id } from "./_helpers";
import { members } from "./members";
import { tenants } from "./tenants";

export const checkinSourceEnum = pgEnum("checkin_source", [
  "qr",
  "manual",
  "kiosk",
]);

export const checkins = pgTable(
  "checkins",
  {
    id: id(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    memberId: uuid("member_id")
      .notNull()
      .references(() => members.id, { onDelete: "cascade" }),
    checkedInAt: timestamp("checked_in_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
    source: checkinSourceEnum("source").notNull().default("manual"),
    gateId: varchar("gate_id", { length: 64 }),
    tokenHash: text("token_hash"),
    createdAt: createdAt(),
  },
  (t) => ({
    tenantTimeIdx: index("checkins_tenant_time_idx").on(
      t.tenantId,
      t.checkedInAt,
    ),
  }),
);

export type Checkin = typeof checkins.$inferSelect;
export type NewCheckin = typeof checkins.$inferInsert;
