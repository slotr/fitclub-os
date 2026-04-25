import { auditLogs } from "@fitness/db";
import { headers } from "next/headers";
import { createSupabaseServerClient } from "./supabase/server";
import { withTenantScope } from "./db";
import { getCurrentTenantId } from "./tenant";

export async function logAudit(
  action: string,
  targetType: string,
  targetId: string | null,
  payload?: Record<string, unknown>,
) {
  const tenantId = await getCurrentTenantId();
  if (!tenantId) return;
  const h = await headers();
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  await withTenantScope(tenantId, async (db) => {
    await db.insert(auditLogs).values({
      tenantId,
      actorId: data.user?.id ?? null,
      action,
      targetType,
      targetId,
      ip: h.get("x-forwarded-for") ?? null,
      userAgent: h.get("user-agent") ?? null,
      payload: payload ?? null,
    });
  });
}
