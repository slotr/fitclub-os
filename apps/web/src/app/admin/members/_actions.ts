"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { members } from "@fitness/db";
import { logAudit } from "@/lib/audit";
import { withTenantScope } from "@/lib/db";
import { getCurrentTenantId } from "@/lib/tenant";
import { parseCreateMember } from "./_parse";

export async function createMemberAction(formData: FormData) {
  const parsed = parseCreateMember(formData);
  if (!parsed.success) return { error: parsed.error.message };
  const tenantId = await getCurrentTenantId();
  await withTenantScope(tenantId, async (db) => {
    await db.insert(members).values({
      tenantId: tenantId!,
      email: parsed.data.email,
      fullName: parsed.data.fullName,
      phone: parsed.data.phone ?? null,
      birthdate: parsed.data.birthdate ?? null,
      gender: parsed.data.gender ?? null,
      status: "pending",
    });
  });
  await logAudit("member.create", "member", null, {
    email: parsed.data.email,
  });
  revalidatePath("/admin/members");
  redirect("/admin/members");
}
