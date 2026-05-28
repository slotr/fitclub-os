"use server";

import { redirect } from "next/navigation";
import { sql } from "drizzle-orm";
import { z } from "zod";
import { studioSettings } from "@fitness/db";
import { logAudit } from "@/lib/audit";
import { withTenantScope } from "@/lib/db";
import { getCurrentTenantId } from "@/lib/tenant";
import { createSupabaseServiceClient } from "@/lib/supabase/server";

const brandingSchema = z.object({
  name: z.string().min(1).max(120),
  accentColor: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "accent color must be #RRGGBB hex")
    .nullable(),
});

export async function updateBrandingAction(formData: FormData) {
  const tenantId = await getCurrentTenantId();
  if (!tenantId) throw new Error("No tenant context");

  const parsed = brandingSchema.parse({
    name: formData.get("name"),
    accentColor: (formData.get("accentColor") as string | null) || null,
  });

  const logoFile = formData.get("logo") as File | null;
  let logoUrl: string | null = null;

  if (logoFile && logoFile.size > 0) {
    if (logoFile.size > 1024 * 1024) {
      throw new Error("Logo must be under 1 MB");
    }
    if (!["image/png", "image/jpeg", "image/webp"].includes(logoFile.type)) {
      throw new Error("Logo must be PNG, JPEG, or WebP");
    }
    const supabase = await createSupabaseServiceClient();
    const ext =
      logoFile.type === "image/png"
        ? "png"
        : logoFile.type === "image/webp"
          ? "webp"
          : "jpg";
    const path = `${tenantId}/logo.${ext}`;
    const buffer = Buffer.from(await logoFile.arrayBuffer());
    const { error: uploadErr } = await supabase.storage
      .from("gym-logos")
      .upload(path, buffer, {
        contentType: logoFile.type,
        upsert: true,
      });
    if (uploadErr) throw uploadErr;
    const { data: urlData } = supabase.storage
      .from("gym-logos")
      .getPublicUrl(path);
    logoUrl = urlData.publicUrl;
  }

  await withTenantScope(tenantId, async (db) => {
    await db
      .insert(studioSettings)
      .values({
        tenantId,
        name: parsed.name,
        accentColor: parsed.accentColor,
        ...(logoUrl ? { logoUrl } : {}),
      })
      .onConflictDoUpdate({
        target: studioSettings.tenantId,
        set: {
          name: parsed.name,
          accentColor: parsed.accentColor,
          ...(logoUrl ? { logoUrl } : {}),
          updatedAt: sql`now()`,
        },
      });
  });

  await logAudit("studio_settings.branding_update", "tenant", tenantId, {
    name: parsed.name,
  });

  redirect(
    "/admin/settings/branding?saved=1" as Parameters<
      typeof redirect
    >[0],
  );
}
