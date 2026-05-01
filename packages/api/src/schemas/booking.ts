import { z } from "zod";

export const bookingStatusSchema = z.enum([
  "booked",
  "cancelled",
  "attended",
  "no_show",
]);

export const bookingInsertSchema = z.object({
  sessionId: z.string().uuid(),
  memberId: z.string().uuid(),
  status: bookingStatusSchema.default("booked"),
});

export const bookingUpdateSchema = z.object({
  status: bookingStatusSchema.optional(),
  cancelledAt: z.coerce.date().nullable().optional(),
});

export const waitlistInsertSchema = z.object({
  sessionId: z.string().uuid(),
  memberId: z.string().uuid(),
  position: z.coerce.number().int().min(1),
});

export const waitlistUpdateSchema = z.object({
  position: z.coerce.number().int().min(1).optional(),
  promotedAt: z.coerce.date().nullable().optional(),
});

export type BookingStatus = z.infer<typeof bookingStatusSchema>;
export type BookingInsert = z.infer<typeof bookingInsertSchema>;
export type BookingUpdate = z.infer<typeof bookingUpdateSchema>;
export type WaitlistInsert = z.infer<typeof waitlistInsertSchema>;
export type WaitlistUpdate = z.infer<typeof waitlistUpdateSchema>;
