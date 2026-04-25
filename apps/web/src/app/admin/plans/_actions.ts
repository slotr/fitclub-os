"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createPlanInput } from "@fitness/api";
import { plans } from "@fitness/db";
import { withTenantScope } from "@/lib/db";
import { getCurrentTenantId } from "@/lib/tenant";

export async function createPlanAction(formData: FormData) {
  const parsed = createPlanInput.safeParse({
    name: formData.get("name"),
    priceMinor: formData.get("priceMinor"),
    currency: formData.get("currency") || "USD",
    durationDays: formData.get("durationDays"),
    features: ((formData.get("features") as string) ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
  });
  if (!parsed.success) return { error: parsed.error.message };
  const tenantId = await getCurrentTenantId();
  await withTenantScope(tenantId, async (db) => {
    await db.insert(plans).values({ ...parsed.data, tenantId: tenantId! });
  });
  revalidatePath("/admin/plans");
  redirect("/admin/plans");
}
