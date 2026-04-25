import "dotenv/config";
import { createDbClient } from "./client";
import { tenants, plans, members, memberships } from "./schema";

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("DATABASE_URL not set");
  const db = createDbClient(databaseUrl);

  console.log("Seeding demo tenant...");
  const [tenant] = await db
    .insert(tenants)
    .values({
      name: "Demo Fitness Club",
      slug: "demo",
      timezone: "Europe/Istanbul",
      brandColor: "#f59e0b",
    })
    .returning();
  if (!tenant) throw new Error("tenant insert failed");

  const [basic, premium] = await db
    .insert(plans)
    .values([
      {
        tenantId: tenant.id,
        name: "Basic Monthly",
        priceMinor: 49900,
        currency: "USD",
        durationDays: 30,
        features: ["Open gym access"],
      },
      {
        tenantId: tenant.id,
        name: "Premium Monthly",
        priceMinor: 89900,
        currency: "USD",
        durationDays: 30,
        features: ["Open gym", "All classes", "Locker"],
      },
    ])
    .returning();
  if (!basic || !premium) throw new Error("plans insert failed");

  const [demoMember] = await db
    .insert(members)
    .values({
      tenantId: tenant.id,
      email: "demo@fitness.local",
      fullName: "Demo Member",
      status: "active",
    })
    .returning();
  if (!demoMember) throw new Error("member insert failed");

  await db.insert(memberships).values({
    memberId: demoMember.id,
    planId: premium.id,
    status: "active",
    startedAt: new Date(),
  });

  console.log(`Seeded tenant ${tenant.slug} with member ${demoMember.email}`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
