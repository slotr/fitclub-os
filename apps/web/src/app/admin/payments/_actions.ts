"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { members, payments } from "@fitness/db";
import { logAudit } from "@/lib/audit";
import { withTenantScope } from "@/lib/db";
import { getCurrentTenantId } from "@/lib/tenant";
import { getStripe } from "@/lib/stripe";
import { sendDunning } from "@/lib/email";
import { formatMoney, getStudioCurrency } from "@/lib/money";

export async function retryPaymentAction(paymentId: string) {
  const tenantId = await getCurrentTenantId();
  const result = await withTenantScope(tenantId, async (db) => {
    const [row] = await db
      .select()
      .from(payments)
      .where(eq(payments.id, paymentId))
      .limit(1);
    if (!row) throw new Error("payment not found");
    if (row.status === "paid") return { ok: true, alreadyPaid: true };
    if (!row.stripeInvoiceId) {
      throw new Error("payment has no stripe invoice id");
    }
    let stripeStatus: "paid" | "failed" = "failed";
    let stripeError: string | null = null;
    try {
      const stripe = getStripe();
      const invoice = await stripe.invoices.pay(row.stripeInvoiceId);
      stripeStatus = invoice.status === "paid" ? "paid" : "failed";
    } catch (err) {
      stripeError = err instanceof Error ? err.message : "stripe error";
    }
    await db
      .update(payments)
      .set({
        attemptCount: row.attemptCount + 1,
        status: stripeStatus === "paid" ? "paid" : row.status,
        paidAt: stripeStatus === "paid" ? new Date() : row.paidAt,
      })
      .where(eq(payments.id, row.id));
    return {
      ok: stripeStatus === "paid",
      attempt: row.attemptCount + 1,
      error: stripeError,
    };
  });
  await logAudit("payment.retry", "payment", paymentId, {
    ok: result.ok,
    attempt: "attempt" in result ? result.attempt : null,
    error: "error" in result ? result.error : null,
  });
  revalidatePath("/admin/payments");
  return result;
}

export async function sendDunningAction(paymentId: string) {
  const tenantId = await getCurrentTenantId();
  const ctx = await withTenantScope(tenantId, async (db) => {
    const [row] = await db
      .select({
        amount: payments.amountMinor,
        currency: payments.currency,
        attemptCount: payments.attemptCount,
        memberEmail: members.email,
        memberName: members.fullName,
      })
      .from(payments)
      .innerJoin(members, eq(members.id, payments.memberId))
      .where(eq(payments.id, paymentId))
      .limit(1);
    return row;
  });
  if (!ctx) throw new Error("payment not found");

  const studioCurrency = await getStudioCurrency();
  const updateUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/m/billing`;
  let dispatched = false;
  try {
    await sendDunning(ctx.memberEmail, {
      memberName: ctx.memberName,
      amountFormatted: formatMoney(ctx.amount, studioCurrency),
      planName: "your membership",
      attemptCount: ctx.attemptCount,
      updatePaymentUrl: updateUrl,
    });
    dispatched = true;
  } catch (err) {
    await logAudit("payment.dunning_failed", "payment", paymentId, {
      error: err instanceof Error ? err.message : "send failed",
    });
    throw err;
  }
  await logAudit("payment.dunning_sent", "payment", paymentId, {
    to: ctx.memberEmail,
    attempt: ctx.attemptCount,
    dispatched,
  });
  revalidatePath("/admin/payments");
  return { ok: dispatched };
}
