"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createMemberInput } from "@fitness/api";
import { members } from "@fitness/db";
import { withTenantScope } from "@/lib/db";
import { getCurrentTenantId } from "@/lib/tenant";

export function parseCreateMember(formData: FormData) {
  return createMemberInput.safeParse({
    email: formData.get("email"),
    fullName: formData.get("fullName"),
    phone: formData.get("phone") || undefined,
    birthdate: formData.get("birthdate") || undefined,
    gender: formData.get("gender") || undefined,
  });
}

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
  revalidatePath("/admin/members");
  redirect("/admin/members");
}
