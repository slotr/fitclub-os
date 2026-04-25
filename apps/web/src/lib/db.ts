import { createDbClient, type DbClient } from "@fitness/db";
import { sql } from "drizzle-orm";

let cached: DbClient | null = null;

function getDb() {
  if (cached) return cached;
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL not set");
  cached = createDbClient(url);
  return cached;
}

export async function withTenantScope<T>(
  tenantId: string | null,
  fn: (db: DbClient) => Promise<T>,
): Promise<T> {
  if (!tenantId) throw new Error("tenant id required");
  const db = getDb();
  return db.transaction(async (tx) => {
    await tx.execute(sql`select set_config('app.tenant_id', ${tenantId}, true)`);
    await tx.execute(sql`set local role authenticated`);
    return fn(tx as unknown as DbClient);
  });
}
