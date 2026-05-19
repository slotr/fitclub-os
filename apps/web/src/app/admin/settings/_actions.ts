"use server";

import { revalidatePath } from "next/cache";
import { sql } from "drizzle-orm";
import { studioSettings } from "@fitness/db";
import { studioSettingsInsertSchema } from "@fitness/api";
import { logAudit } from "@/lib/audit";
import { withTenantScope } from "@/lib/db";
import { getCurrentTenantId } from "@/lib/tenant";

export async function stubSaveSettingsAction(formData: FormData) {
  const parsed = studioSettingsInsertSchema.safeParse({
    name: String(formData.get("name") ?? ""),
    timezone: String(formData.get("timezone") ?? "Europe/Istanbul"),
    locale: String(formData.get("locale") ?? "en"),
    currency: String(formData.get("currency") ?? "TRY"),
    accentColor: formData.get("accentColor") || null,
  });
  if (!parsed.success) {
    return { error: parsed.error.flatten() };
  }
  const tenantId = await getCurrentTenantId();
  if (!tenantId) throw new Error("tenant id required");

  await withTenantScope(tenantId, async (db) => {
    await db
      .insert(studioSettings)
      .values({
        tenantId,
        name: parsed.data.name,
        timezone: parsed.data.timezone,
        locale: parsed.data.locale,
        currency: parsed.data.currency,
        accentColor: parsed.data.accentColor ?? null,
      })
      .onConflictDoUpdate({
        target: studioSettings.tenantId,
        set: {
          name: parsed.data.name,
          timezone: parsed.data.timezone,
          locale: parsed.data.locale,
          currency: parsed.data.currency,
          accentColor: parsed.data.accentColor ?? null,
          updatedAt: sql`now()`,
        },
      });
  });
  await logAudit("settings.update", "tenant", tenantId, {
    name: parsed.data.name,
    timezone: parsed.data.timezone,
    locale: parsed.data.locale,
    currency: parsed.data.currency,
  });
  revalidatePath("/admin/settings");
  return { ok: true };
}
