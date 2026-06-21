import {
  index,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { createdAt, id } from "./_helpers";
import { members } from "./members";
import { notificationChannelEnum, notificationTemplates } from "./notificationTemplates";
import { tenants } from "./tenants";

export const notificationSendStatusEnum = pgEnum("notification_send_status", [
  "queued",
  "sent",
  "delivered",
  "failed",
]);

export const notificationSends = pgTable(
  "notification_sends",
  {
    id: id(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "restrict" }),
    templateId: uuid("template_id")
      .notNull()
      .references(() => notificationTemplates.id, { onDelete: "restrict" }),
    memberId: uuid("member_id")
      .notNull()
      .references(() => members.id, { onDelete: "cascade" }),
    channel: notificationChannelEnum("channel").notNull(),
    status: notificationSendStatusEnum("status").notNull().default("queued"),
    sentAt: timestamp("sent_at", { withTimezone: true }),
    error: text("error"),
    createdAt: createdAt(),
  },
  (t) => ({
    tenantCreatedIdx: index("notification_sends_tenant_created_idx").on(
      t.tenantId,
      t.createdAt,
    ),
    memberIdx: index("notification_sends_member_idx").on(t.memberId),
  }),
);

export type NotificationSend = typeof notificationSends.$inferSelect;
export type NewNotificationSend = typeof notificationSends.$inferInsert;
