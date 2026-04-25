import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

export function createDbClient(databaseUrl: string) {
  const sql = postgres(databaseUrl, {
    prepare: false,
    max: 10,
    idle_timeout: 20,
  });
  return drizzle(sql, { schema, logger: false });
}

export type DbClient = ReturnType<typeof createDbClient>;
