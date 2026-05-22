import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { SEED_EXERCISES } from "./data/exercises";
import { exercises } from "./schema/exercises";

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  const sql = postgres(url);
  const db = drizzle(sql);

  for (const e of SEED_EXERCISES) {
    await db
      .insert(exercises)
      .values({
        tenantId: null,
        memberId: null,
        slug: e.slug,
        name: e.name,
        primaryMuscle: e.primaryMuscle,
        equipment: e.equipment,
        metric: e.metric,
        defaultRestSec: e.defaultRestSec,
        instructions: e.instructions,
      })
      .onConflictDoUpdate({
        target: exercises.slug,
        set: {
          name: e.name,
          primaryMuscle: e.primaryMuscle,
          equipment: e.equipment,
          metric: e.metric,
          defaultRestSec: e.defaultRestSec,
          instructions: e.instructions,
        },
      });
  }

  console.log(`Seeded ${SEED_EXERCISES.length} exercises.`);
  await sql.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
