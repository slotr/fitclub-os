"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { members, memberships, plans } from "@fitness/db";
import { logAudit } from "@/lib/audit";
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
  redirect(session.url as Parameters<typeof redirect>[0]);
}

export async function activateMemberAction(memberId: string) {
  const tenantId = await getCurrentTenantId();
  await withTenantScope(tenantId, async (db) => {
    await db
      .update(members)
      .set({ status: "active" })
      .where(eq(members.id, memberId));
  });
  await logAudit("member.activate", "member", memberId, {});
  revalidatePath(`/admin/members/${memberId}`);
}

export async function pauseMembershipAction(memberId: string) {
  const tenantId = await getCurrentTenantId();
  await withTenantScope(tenantId, async (db) => {
    await db
      .update(memberships)
      .set({ status: "paused", pausedAt: new Date() })
      .where(
        and(
          eq(memberships.memberId, memberId),
          eq(memberships.status, "active"),
        ),
      );
  });
  await logAudit("membership.pause", "member", memberId, {});
  revalidatePath(`/admin/members/${memberId}`);
}

export async function resumeMembershipAction(memberId: string) {
  const tenantId = await getCurrentTenantId();
  await withTenantScope(tenantId, async (db) => {
    await db
      .update(memberships)
      .set({ status: "active", pausedAt: null })
      .where(
        and(
          eq(memberships.memberId, memberId),
          eq(memberships.status, "paused"),
        ),
      );
  });
  await logAudit("membership.resume", "member", memberId, {});
  revalidatePath(`/admin/members/${memberId}`);
}

export async function cancelMembershipAction(memberId: string) {
  const tenantId = await getCurrentTenantId();
  await withTenantScope(tenantId, async (db) => {
    await db
      .update(memberships)
      .set({ status: "cancelled" })
      .where(eq(memberships.memberId, memberId));
    await db
      .update(members)
      .set({ status: "inactive" })
      .where(eq(members.id, memberId));
  });
  await logAudit("membership.cancel", "member", memberId, {});
  revalidatePath(`/admin/members/${memberId}`);
}
