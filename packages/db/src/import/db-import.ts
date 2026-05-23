import { drizzle } from "drizzle-orm/postgres-js";
import { sql } from "drizzle-orm";
import { exercises } from "../schema/exercises";
import type { MappedExercise } from "./types";

type Db = ReturnType<typeof drizzle>;

/**
 * Upsert every mapped exercise (keyed by slug — existing rows keep their
 * UUID, new rows get a fresh one) and soft-delete any other global
 * exercise that is not referenced by `workout_sets`.
 *
 * Returns { upserted, softDeleted }.
 */
export async function importExercises(
  db: Db,
  rows: MappedExercise[],
): Promise<{ upserted: number; softDeleted: number }> {
  const slugs = rows.map((r) => r.slug);
  let softDeleted = 0;

  await db.transaction(async (tx) => {
    if (rows.length > 0) {
      await tx
        .insert(exercises)
        .values(
          rows.map((r) => ({
            tenantId: null,
            memberId: null,
            slug: r.slug,
            name: r.name,
            primaryMuscle: r.primaryMuscle,
            equipment: r.equipment,
            metric: r.metric,
            defaultRestSec: r.defaultRestSec,
            instructions: r.instructions,
            imageUrl: r.imageUrl,
          })),
        )
        .onConflictDoUpdate({
          target: exercises.slug,
          set: {
            name: sql`excluded.name`,
            primaryMuscle: sql`excluded.primary_muscle`,
            equipment: sql`excluded.equipment`,
            metric: sql`excluded.metric`,
            defaultRestSec: sql`excluded.default_rest_sec`,
            instructions: sql`excluded.instructions`,
            imageUrl: sql`excluded.image_url`,
            updatedAt: sql`now()`,
            deletedAt: sql`null`,
          },
        });
    }

    // Soft-delete obsolete global rows that have no workout_sets reference.
    // Bind the slug list as an inline IN-list (postgres-js binds each
    // value as its own parameter — no array cast needed).
    if (slugs.length > 0) {
      const slugList = sql.join(
        slugs.map((s) => sql`${s}`),
        sql`, `,
      );
      const result = await tx.execute(sql`
        update public.exercises
        set deleted_at = now(), updated_at = now()
        where tenant_id is null
          and member_id is null
          and deleted_at is null
          and slug not in (${slugList})
          and id not in (select distinct exercise_id from public.workout_sets)
      `);
      softDeleted = (result as { rowCount?: number }).rowCount ?? 0;
    }
  });

  return { upserted: rows.length, softDeleted };
}
