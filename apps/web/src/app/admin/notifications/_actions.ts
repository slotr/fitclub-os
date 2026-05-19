"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { members, notificationSends, notificationTemplates } from "@fitness/db";
import { notificationTemplateUpdateSchema } from "@fitness/api";
import { logAudit } from "@/lib/audit";
import { withTenantScope } from "@/lib/db";
import { getCurrentTenantId } from "@/lib/tenant";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function stubSaveTemplateAction(
  templateId: string,
  formData: FormData,
) {
  const parsed = notificationTemplateUpdateSchema.safeParse({
    subject: formData.get("subject") || null,
    body: String(formData.get("body") ?? ""),
    enabled: formData.get("enabled") === "on",
  });
  if (!parsed.success) {
    return { error: parsed.error.flatten() };
  }
  const tenantId = await getCurrentTenantId();
  await withTenantScope(tenantId, async (db) => {
    await db
      .update(notificationTemplates)
      .set({
        subject: parsed.data.subject ?? null,
        body: parsed.data.body ?? "",
        enabled: parsed.data.enabled ?? true,
      })
      .where(eq(notificationTemplates.id, templateId));
  });
  await logAudit(
    "notification.template_saved",
    "notification_template",
    templateId,
    {
      enabled: parsed.data.enabled,
    },
  );
  revalidatePath("/admin/notifications");
  return { ok: true };
}

export async function stubSendTestAction(templateId: string) {
  const tenantId = await getCurrentTenantId();
  if (!tenantId) throw new Error("tenant id required");
  const supabase = await createSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();
  const adminEmail = auth.user?.email ?? null;

  const result = await withTenantScope(tenantId, async (db) => {
    const [tmpl] = await db
      .select()
      .from(notificationTemplates)
      .where(eq(notificationTemplates.id, templateId))
      .limit(1);
    if (!tmpl) throw new Error("template not found");
    let testRecipient: typeof members.$inferSelect | undefined;
    if (adminEmail) {
      [testRecipient] = await db
        .select()
        .from(members)
        .where(eq(members.email, adminEmail))
        .limit(1);
    }
    if (testRecipient) {
      await db.insert(notificationSends).values({
        tenantId,
        templateId,
        memberId: testRecipient.id,
        channel: tmpl.channel,
        status: "sent",
        sentAt: new Date(),
      });
    }
    return {
      channel: tmpl.channel,
      sentTo: testRecipient?.email ?? null,
    };
  });

  await logAudit("notification.test_sent", "notification_template", templateId, {
    channel: result.channel,
    sentTo: result.sentTo,
    note: result.sentTo
      ? "send recorded in notification_sends"
      : "no member row matches admin email; test logged only",
  });
  revalidatePath("/admin/notifications");
  return { ok: true, sentTo: result.sentTo };
}
