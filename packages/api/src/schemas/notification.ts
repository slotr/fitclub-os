import { z } from "zod";

export const notificationChannelSchema = z.enum([
  "push",
  "sms",
  "whatsapp",
  "email",
]);

export const notificationSendStatusSchema = z.enum([
  "queued",
  "sent",
  "delivered",
  "failed",
]);

export const notificationTemplateInsertSchema = z.object({
  key: z.string().min(1).max(64),
  channel: notificationChannelSchema,
  subject: z.string().max(256).nullable().optional(),
  body: z.string().min(1),
  variables: z.array(z.string()).default([]),
  enabled: z.boolean().default(true),
});

export const notificationTemplateUpdateSchema =
  notificationTemplateInsertSchema.partial();

export const notificationSendInsertSchema = z.object({
  templateId: z.string().uuid(),
  memberId: z.string().uuid(),
  channel: notificationChannelSchema,
  status: notificationSendStatusSchema.default("queued"),
});

export const notificationSendUpdateSchema = z.object({
  status: notificationSendStatusSchema.optional(),
  sentAt: z.coerce.date().nullable().optional(),
  error: z.string().nullable().optional(),
});

export type NotificationChannel = z.infer<typeof notificationChannelSchema>;
export type NotificationSendStatus = z.infer<
  typeof notificationSendStatusSchema
>;
export type NotificationTemplateInsert = z.infer<
  typeof notificationTemplateInsertSchema
>;
export type NotificationTemplateUpdate = z.infer<
  typeof notificationTemplateUpdateSchema
>;
export type NotificationSendInsert = z.infer<
  typeof notificationSendInsertSchema
>;
export type NotificationSendUpdate = z.infer<
  typeof notificationSendUpdateSchema
>;
