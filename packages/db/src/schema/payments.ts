import {
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { createdAt, id } from "./_helpers";
import { members } from "./members";

export const paymentStatusEnum = pgEnum("payment_status", [
  "paid",
  "failed",
  "refunded",
]);

export const payments = pgTable("payments", {
  id: id(),
  memberId: uuid("member_id")
    .notNull()
    .references(() => members.id, { onDelete: "cascade" }),
  amountMinor: integer("amount_minor").notNull(),
  currency: varchar("currency", { length: 3 }).notNull(),
  stripeInvoiceId: text("stripe_invoice_id").unique(),
  status: paymentStatusEnum("status").notNull(),
  paidAt: timestamp("paid_at", { withTimezone: true }),
  attemptCount: integer("attempt_count").notNull().default(1),
  createdAt: createdAt(),
});

export type Payment = typeof payments.$inferSelect;
export type NewPayment = typeof payments.$inferInsert;
