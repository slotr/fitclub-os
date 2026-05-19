import { inArray, sql } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createDbClient } from "../client";
import {
  classes,
  members,
  notificationTemplates,
  sessions,
  studioSettings,
  tenants,
} from "../schema";

const databaseUrl = process.env.DATABASE_URL;

describe.runIf(databaseUrl)("RLS isolates tenants", () => {
  const db = createDbClient(databaseUrl!);
  let tenantA: string;
  let tenantB: string;
  let classA: string;
  let classB: string;
  let sessionA: string;
  let sessionB: string;

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
    const [ca, cb] = await db
      .insert(classes)
      .values([
        {
          tenantId: tenantA,
          name: "Yoga A",
          category: "yoga",
          defaultDurationMin: 60,
          defaultCapacity: 10,
        },
        {
          tenantId: tenantB,
          name: "Yoga B",
          category: "yoga",
          defaultDurationMin: 60,
          defaultCapacity: 10,
        },
      ])
      .returning();
    classA = ca!.id;
    classB = cb!.id;
    const now = new Date();
    const [sa, sb] = await db
      .insert(sessions)
      .values([
        {
          tenantId: tenantA,
          classId: classA,
          startsAt: now,
          endsAt: new Date(now.getTime() + 60 * 60_000),
          capacity: 10,
        },
        {
          tenantId: tenantB,
          classId: classB,
          startsAt: now,
          endsAt: new Date(now.getTime() + 60 * 60_000),
          capacity: 10,
        },
      ])
      .returning();
    sessionA = sa!.id;
    sessionB = sb!.id;
    await db.insert(notificationTemplates).values([
      {
        tenantId: tenantA,
        key: "welcome",
        channel: "email",
        body: "Hi A",
      },
      {
        tenantId: tenantB,
        key: "welcome",
        channel: "email",
        body: "Hi B",
      },
    ]);
    await db.insert(studioSettings).values([
      { tenantId: tenantA, name: "Studio A" },
      { tenantId: tenantB, name: "Studio B" },
    ]);
  });

  afterAll(async () => {
    if (!tenantA || !tenantB) return;
    await db
      .delete(notificationTemplates)
      .where(inArray(notificationTemplates.tenantId, [tenantA, tenantB]));
    await db
      .delete(sessions)
      .where(inArray(sessions.id, [sessionA, sessionB]));
    await db.delete(classes).where(inArray(classes.id, [classA, classB]));
    await db
      .delete(studioSettings)
      .where(inArray(studioSettings.tenantId, [tenantA, tenantB]));
    await db.delete(members).where(inArray(members.tenantId, [tenantA, tenantB]));
    await db.delete(tenants).where(inArray(tenants.id, [tenantA, tenantB]));
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

  it("a tenant only sees its own classes + sessions", async () => {
    await db.transaction(async (tx) => {
      await tx.execute(sql`set local role authenticated`);
      await tx.execute(sql`select set_config('app.tenant_id', ${tenantA}, true)`);
      const cls = await tx.select().from(classes);
      const ses = await tx.select().from(sessions);
      expect(cls.every((c) => c.tenantId === tenantA)).toBe(true);
      expect(ses.every((s) => s.tenantId === tenantA)).toBe(true);
    });
  });

  it("a tenant only sees its own notification templates and studio settings", async () => {
    await db.transaction(async (tx) => {
      await tx.execute(sql`set local role authenticated`);
      await tx.execute(sql`select set_config('app.tenant_id', ${tenantB}, true)`);
      const tmpl = await tx.select().from(notificationTemplates);
      const settings = await tx.select().from(studioSettings);
      expect(tmpl.every((t) => t.tenantId === tenantB)).toBe(true);
      expect(settings.every((s) => s.tenantId === tenantB)).toBe(true);
    });
  });
});
