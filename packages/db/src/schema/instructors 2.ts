import {
  index,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { createdAt, id } from "./_helpers";
import { tenants } from "./tenants";

export const instructors = pgTable(
  "instructors",
  {
    id: id(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "restrict" }),
    name: text("name").notNull(),
    email: varchar("email", { length: 256 }),
    phone: varchar("phone", { length: 32 }),
    photoUrl: text("photo_url"),
    bio: text("bio"),
    archivedAt: timestamp("archived_at", { withTimezone: true }),
    createdAt: createdAt(),
  },
  (t) => ({
    tenantIdx: index("instructors_tenant_idx").on(t.tenantId),
  }),
);

export type Instructor = typeof instructors.$inferSelect;
export type NewInstructor = typeof instructors.$inferInsert;
