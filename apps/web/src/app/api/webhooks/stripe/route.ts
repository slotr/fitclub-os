import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import {
  createDbClient,
  members,
  memberships,
  payments,
} from "@fitness/db";
import { sendReceipt } from "@/lib/email";
import { getStripe } from "@/lib/stripe";

const dbUrl = process.env.DATABASE_URL ?? "";
const db = dbUrl ? createDbClient(dbUrl) : null;

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const sig = req.headers.get("stripe-signature");
  if (!sig) return new NextResponse("missing signature", { status: 400 });
  const payload = await req.text();
  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(
      payload,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!,
    );
  } catch (err) {
    return new NextResponse(`signature error: ${(err as Error).message}`, {
      status: 400,
    });
  }

  if (!db) {
    return new NextResponse("db not configured", { status: 500 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const tenantId = session.metadata?.tenant_id;
      const memberId = session.metadata?.member_id;
      const planId = session.metadata?.plan_id;
      const subscriptionId = session.subscription as string | null;
      if (!tenantId || !memberId || !planId || !subscriptionId) break;
      await db.insert(memberships).values({
        memberId,
        planId,
        status: "active",
        startedAt: new Date(),
        stripeSubscriptionId: subscriptionId,
        autoRenew: true,
      });
      await db
        .update(members)
        .set({ status: "active" })
        .where(eq(members.id, memberId));
      break;
    }
    case "invoice.paid": {
      const invoice = event.data.object as Stripe.Invoice;
      const memberEmail = invoice.customer_email;
      if (!memberEmail) break;
      if (!invoice.id) break;
      const [member] = await db
        .select()
        .from(members)
        .where(eq(members.email, memberEmail));
      if (!member) break;
      await db
        .insert(payments)
        .values({
          memberId: member.id,
          amountMinor: invoice.amount_paid,
          currency: invoice.currency.toUpperCase(),
          stripeInvoiceId: invoice.id,
          status: "paid",
          paidAt: invoice.status_transitions.paid_at
            ? new Date(invoice.status_transitions.paid_at * 1000)
            : new Date(),
        })
        .onConflictDoNothing({ target: payments.stripeInvoiceId });
      try {
        const formatter = new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: invoice.currency.toUpperCase(),
        });
        await sendReceipt(member.email, {
          memberName: member.fullName,
          amountFormatted: formatter.format(invoice.amount_paid / 100),
          planName: "Membership",
          paidAt: new Date(
            (invoice.status_transitions.paid_at ??
              Math.floor(Date.now() / 1000)) * 1000,
          )
            .toISOString()
            .slice(0, 10),
        });
      } catch (err) {
        console.error("Failed to send receipt", err);
      }
      break;
    }
    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;
      const memberEmail = invoice.customer_email;
      if (!memberEmail) break;
      if (!invoice.id) break;
      const [member] = await db
        .select()
        .from(members)
        .where(eq(members.email, memberEmail));
      if (!member) break;
      await db
        .insert(payments)
        .values({
          memberId: member.id,
          amountMinor: invoice.amount_due,
          currency: invoice.currency.toUpperCase(),
          stripeInvoiceId: invoice.id,
          status: "failed",
          attemptCount: invoice.attempt_count ?? 1,
        })
        .onConflictDoNothing({ target: payments.stripeInvoiceId });
      // Phase 4 will hook dunning here.
      break;
    }
    default:
      break;
  }

  return NextResponse.json({ received: true });
}
