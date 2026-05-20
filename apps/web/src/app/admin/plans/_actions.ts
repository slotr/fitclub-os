"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { createPlanInput } from "@fitness/api";
import { plans } from "@fitness/db";
import { withTenantScope } from "@/lib/db";
import { getCurrentTenantId } from "@/lib/tenant";

function parsePlanForm(formData: FormData) {
  return createPlanInput.safeParse({
    name: formData.get("name"),
    priceMinor: formData.get("priceMinor"),
    currency: formData.get("currency") || "USD",
    durationDays: formData.get("durationDays"),
    features: ((formData.get("features") as string) ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
  });
}

export async function createPlanAction(formData: FormData) {
  const parsed = parsePlanForm(formData);
  if (!parsed.success) return { error: parsed.error.message };
  const tenantId = await getCurrentTenantId();
  await withTenantScope(tenantId, async (db) => {
    await db.insert(plans).values({ ...parsed.data, tenantId: tenantId! });
  });
  revalidatePath("/admin/plans");
  redirect("/admin/plans");
}

export async function updatePlanAction(planId: string, formData: FormData) {
  const parsed = parsePlanForm(formData);
  if (!parsed.success) return { error: parsed.error.message };
  const active = formData.get("active") === "on";
  const tenantId = await getCurrentTenantId();
  await withTenantScope(tenantId, async (db) => {
    await db
      .update(plans)
      .set({ ...parsed.data, active })
      .where(eq(plans.id, planId));
  });
  revalidatePath("/admin/plans");
  redirect("/admin/plans");
}
