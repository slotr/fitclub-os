import { sql } from "drizzle-orm";
import {
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { tenants } from "./tenants";

export type StudioHours = {
  day: string;
  open: string;
  close: string;
};

export const studioSettings = pgTable("studio_settings", {
  tenantId: uuid("tenant_id")
    .primaryKey()
    .references(() => tenants.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  timezone: varchar("timezone", { length: 64 })
    .notNull()
    .default("Europe/Istanbul"),
  locale: varchar("locale", { length: 16 }).notNull().default("en"),
  currency: varchar("currency", { length: 3 }).notNull().default("TRY"),
  accentColor: varchar("accent_color", { length: 16 }),
  logoUrl: text("logo_url"),
  hours: jsonb("hours").$type<StudioHours[]>().notNull().default([]),
  integrations: jsonb("integrations")
    .$type<Record<string, unknown>>()
    .notNull()
    .default({}),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .default(sql`now()`),
});

export type StudioSettings = typeof studioSettings.$inferSelect;
export type NewStudioSettings = typeof studioSettings.$inferInsert;
