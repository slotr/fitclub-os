"use server";

import { revalidatePath } from "next/cache";
import { checkins } from "@fitness/db";
import { withTenantScope } from "@/lib/db";
import { getCurrentTenantId } from "@/lib/tenant";

export async function manualCheckinAction(formData: FormData) {
  const memberId = formData.get("memberId");
  if (typeof memberId !== "string") return { error: "missing memberId" };
  const tenantId = await getCurrentTenantId();
  await withTenantScope(tenantId, async (db) => {
    await db.insert(checkins).values({
      memberId,
      tenantId: tenantId!,
      source: "manual",
    });
  });
  revalidatePath("/admin/checkins");
}
