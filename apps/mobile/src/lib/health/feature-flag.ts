import { getSupabase } from "../supabase";

let cached: boolean | null = null;

/**
 * Reads `app_config.health_sync_enabled` from Supabase. Default: enabled.
 * Cached in module memory for the session — restart app to refresh.
 *
 * Remote disable:
 *   INSERT INTO app_config (key, value) VALUES ('health_sync_enabled', 'false')
 *     ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
 */
export async function isHealthSyncFeatureEnabled(): Promise<boolean> {
  if (cached !== null) return cached;
  const supabase = getSupabase();
  if (!supabase) {
    cached = true;
    return true;
  }
  const { data } = await supabase
    .from("app_config")
    .select("value")
    .eq("key", "health_sync_enabled")
    .maybeSingle();
  cached = data?.value !== "false";
  return cached;
}

export function resetFeatureFlagCache(): void {
  cached = null;
}
