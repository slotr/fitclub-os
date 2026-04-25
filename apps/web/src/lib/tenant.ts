import { createSupabaseServerClient } from "./supabase/server";

export async function getCurrentTenantId(): Promise<string | null> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return null;
  const tenantId = data.user.app_metadata.tenant_id as string | undefined;
  return tenantId ?? null;
}
