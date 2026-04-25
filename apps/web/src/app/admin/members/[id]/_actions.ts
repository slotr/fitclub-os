"use server";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { members, plans } from "@fitness/db";
import { withTenantScope } from "@/lib/db";
import { getCurrentTenantId } from "@/lib/tenant";
import { getStripe } from "@/lib/stripe";

export async function createCheckoutSessionAction(
  memberId: string,
  planId: string,
) {
  const tenantId = await getCurrentTenantId();
  const stripe = getStripe();

  const { member, plan } = await withTenantScope(tenantId, async (db) => {
    const [m] = await db.select().from(members).where(eq(members.id, memberId));
    const [p] = await db.select().from(plans).where(eq(plans.id, planId));
    if (!m || !p) throw new Error("not found");
    return { member: m, plan: p };
  });

  if (!plan.stripePriceId) {
    throw new Error("Plan is not linked to a Stripe price");
  }

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer_email: member.email,
    line_items: [{ price: plan.stripePriceId, quantity: 1 }],
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/admin/members/${member.id}?paid=1`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/admin/members/${member.id}?cancelled=1`,
    metadata: {
      tenant_id: tenantId!,
      member_id: member.id,
      plan_id: plan.id,
    },
  });

  if (!session.url) throw new Error("no checkout url");
  redirect(session.url);
}
