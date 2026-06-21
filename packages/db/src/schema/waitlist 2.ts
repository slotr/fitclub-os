import { sql } from "drizzle-orm";
import {
  index,
  integer,
  pgTable,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { createdAt, id } from "./_helpers";
import { members } from "./members";
import { sessions } from "./sessions";
import { tenants } from "./tenants";

export const waitlist = pgTable(
  "waitlist",
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
    position: integer("position").notNull(),
    joinedAt: timestamp("joined_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
    promotedAt: timestamp("promoted_at", { withTimezone: true }),
    createdAt: createdAt(),
  },
  (t) => ({
    sessionMemberUnique: uniqueIndex("waitlist_session_member_uniq").on(
      t.sessionId,
      t.memberId,
    ),
    sessionPositionIdx: index("waitlist_session_position_idx").on(
      t.sessionId,
      t.position,
    ),
  }),
);

export type Waitlist = typeof waitlist.$inferSelect;
export type NewWaitlist = typeof waitlist.$inferInsert;
