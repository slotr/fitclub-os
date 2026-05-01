import {
  boolean,
  jsonb,
  pgEnum,
  pgTable,
  text,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { createdAt, id } from "./_helpers";
import { tenants } from "./tenants";

export const notificationChannelEnum = pgEnum("notification_channel", [
  "push",
  "sms",
  "whatsapp",
  "email",
]);

export const notificationTemplates = pgTable(
  "notification_templates",
  {
    id: id(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "restrict" }),
    key: varchar("key", { length: 64 }).notNull(),
    channel: notificationChannelEnum("channel").notNull(),
    subject: text("subject"),
    body: text("body").notNull(),
    variables: jsonb("variables").$type<string[]>().notNull().default([]),
    enabled: boolean("enabled").notNull().default(true),
    createdAt: createdAt(),
  },
  (t) => ({
    tenantKeyChannelUnique: uniqueIndex(
      "notification_templates_tenant_key_channel_uniq",
    ).on(t.tenantId, t.key, t.channel),
  }),
);

export type NotificationTemplate = typeof notificationTemplates.$inferSelect;
export type NewNotificationTemplate =
  typeof notificationTemplates.$inferInsert;
