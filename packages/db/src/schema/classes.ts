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
import { tenants } from "./tenants";

export const classCategoryEnum = pgEnum("class_category", [
  "yoga",
  "cross",
  "pilates",
  "strength",
  "cardio",
  "pt",
]);

export const classes = pgTable(
  "classes",
  {
    id: id(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "restrict" }),
    name: text("name").notNull(),
    category: classCategoryEnum("category").notNull(),
    defaultDurationMin: integer("default_duration_min").notNull(),
    defaultCapacity: integer("default_capacity").notNull(),
    room: varchar("room", { length: 64 }),
    color: varchar("color", { length: 16 }),
    archivedAt: timestamp("archived_at", { withTimezone: true }),
    createdAt: createdAt(),
  },
  (t) => ({
    tenantCategoryIdx: index("classes_tenant_category_idx").on(
      t.tenantId,
      t.category,
    ),
  }),
);

export type Class = typeof classes.$inferSelect;
export type NewClass = typeof classes.$inferInsert;
