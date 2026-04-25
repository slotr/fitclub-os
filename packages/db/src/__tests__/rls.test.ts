import { sql } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createDbClient } from "../client";
import { members, tenants } from "../schema";

const databaseUrl = process.env.DATABASE_URL!;

describe("RLS isolates tenants", () => {
  const db = createDbClient(databaseUrl);
  let tenantA: string;
  let tenantB: string;

  beforeAll(async () => {
    const [a] = await db
      .insert(tenants)
      .values({ name: "Tenant A", slug: `a-${Date.now()}` })
      .returning();
    const [b] = await db
      .insert(tenants)
      .values({ name: "Tenant B", slug: `b-${Date.now()}` })
      .returning();
    tenantA = a!.id;
    tenantB = b!.id;
    await db.insert(members).values([
      { tenantId: tenantA, email: "a@x.com", fullName: "A One" },
      { tenantId: tenantB, email: "b@x.com", fullName: "B One" },
    ]);
  });

  afterAll(async () => {
    await db.delete(members);
    await db.delete(tenants);
  });

  it("a tenant only sees its own members", async () => {
    await db.transaction(async (tx) => {
      await tx.execute(sql`set local role authenticated`);
      await tx.execute(sql`select set_config('app.tenant_id', ${tenantA}, true)`);
      const visible = await tx.select().from(members);
      expect(visible.every((m) => m.tenantId === tenantA)).toBe(true);
      expect(visible.length).toBe(1);
    });
  });
});
