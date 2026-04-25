import { pgTable, text, varchar } from "drizzle-orm/pg-core";
import { createdAt, id } from "./_helpers";

export const tenants = pgTable("tenants", {
  id: id(),
  name: text("name").notNull(),
  slug: varchar("slug", { length: 64 }).notNull().unique(),
  brandColor: varchar("brand_color", { length: 16 }).notNull().default("#f59e0b"),
  logoUrl: text("logo_url"),
  timezone: varchar("timezone", { length: 64 }).notNull().default("UTC"),
  locale: varchar("locale", { length: 8 }).notNull().default("en"),
  createdAt: createdAt(),
});

export type Tenant = typeof tenants.$inferSelect;
export type NewTenant = typeof tenants.$inferInsert;
