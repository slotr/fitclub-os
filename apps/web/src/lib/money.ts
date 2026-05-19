import { cache } from "react";
import { eq } from "drizzle-orm";
import { studioSettings } from "@fitness/db";
import { withTenantScope } from "./db";
import { getCurrentTenantId } from "./tenant";

export { currencySymbol, formatMoney, formatMoneyShort } from "./money-format";

export const getStudioCurrency = cache(async (): Promise<string> => {
  const tenantId = await getCurrentTenantId();
  if (!tenantId) return "TRY";
  try {
    return await withTenantScope(tenantId, async (db) => {
      const [row] = await db
        .select({ currency: studioSettings.currency })
        .from(studioSettings)
        .where(eq(studioSettings.tenantId, tenantId))
        .limit(1);
      return row?.currency ?? "TRY";
    });
  } catch {
    return "TRY";
  }
});
