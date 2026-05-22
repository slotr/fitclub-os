import { eq } from "drizzle-orm";
import { selectPending } from "@fitness/api";
import { getSupabase } from "../lib/supabase";
import { db } from "../db/client";
import {
  exercises,
  memberExercisePrefs,
  workouts,
  workoutSets,
} from "../db/schema";
import { upsertExercise } from "../db/repo";
import type { LocalExercise } from "../db/schema";

let lastPullAt = "1970-01-01T00:00:00Z";

/** Pull the global exercise library + own custom exercises into SQLite. */
async function pullLibrary(memberId: string): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) return;
  const { data, error } = await supabase
    .from("exercises")
    .select("*")
    .gt("updated_at", lastPullAt);
  if (error || !data) return;
  for (const e of data as Record<string, unknown>[]) {
    const row: LocalExercise = {
      id: String(e.id),
      tenantId: (e.tenant_id as string) ?? null,
      memberId: (e.member_id as string) ?? null,
      slug: (e.slug as string) ?? null,
      name: String(e.name),
      primaryMuscle: String(e.primary_muscle),
      equipment: String(e.equipment),
      metric: String(e.metric),
      defaultRestSec: Number(e.default_rest_sec ?? 90),
      instructions: (e.instructions as string) ?? null,
      imageUrl: (e.image_url as string) ?? null,
      createdAt: String(e.created_at),
      updatedAt: String(e.updated_at),
      deletedAt: (e.deleted_at as string) ?? null,
      syncStatus: "synced",
      syncedAt: new Date().toISOString(),
    };
    upsertExercise(row);
  }
  lastPullAt = new Date().toISOString();
}

/** Push pending workouts + their sets to Supabase. */
async function pushWorkouts(): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) return;
  const pending = selectPending(db.select().from(workouts).all());
  for (const w of pending) {
    const setRows = db
      .select()
      .from(workoutSets)
      .where(eq(workoutSets.workoutId, w.id))
      .all();
    const { error: wErr } = await supabase.from("workouts").upsert({
      id: w.id,
      tenant_id: w.tenantId,
      member_id: w.memberId,
      title: w.title,
      started_at: w.startedAt,
      finished_at: w.finishedAt,
      duration_sec: w.durationSec,
      total_volume: w.totalVolume,
      notes: w.notes,
      updated_at: w.updatedAt,
      deleted_at: w.deletedAt,
    });
    let ok = !wErr;
    if (ok && setRows.length > 0) {
      const { error: sErr } = await supabase.from("workout_sets").upsert(
        setRows.map((s) => ({
          id: s.id,
          workout_id: s.workoutId,
          exercise_id: s.exerciseId,
          order_index: s.orderIndex,
          set_index: s.setIndex,
          weight: s.weight,
          reps: s.reps,
          duration_sec: s.durationSec,
          rest_sec: s.restSec,
          is_warmup: s.isWarmup === 1,
          is_pr: s.isPr === 1,
        })),
      );
      ok = !sErr;
    }
    db.update(workouts)
      .set({ syncStatus: ok ? "synced" : "failed" })
      .where(eq(workouts.id, w.id))
      .run();
  }
}

/** Push pending custom exercises + prefs. */
async function pushCustom(): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) return;
  const pendingEx = db
    .select()
    .from(exercises)
    .where(eq(exercises.syncStatus, "pending"))
    .all();
  for (const e of pendingEx) {
    const { error } = await supabase.from("exercises").upsert({
      id: e.id,
      tenant_id: e.tenantId,
      member_id: e.memberId,
      name: e.name,
      primary_muscle: e.primaryMuscle,
      equipment: e.equipment,
      metric: e.metric,
      default_rest_sec: e.defaultRestSec,
      updated_at: e.updatedAt,
      deleted_at: e.deletedAt,
    });
    db.update(exercises)
      .set({ syncStatus: error ? "failed" : "synced" })
      .where(eq(exercises.id, e.id))
      .run();
  }
  const pendingPrefs = db
    .select()
    .from(memberExercisePrefs)
    .where(eq(memberExercisePrefs.syncStatus, "pending"))
    .all();
  for (const p of pendingPrefs) {
    const { error } = await supabase.from("member_exercise_prefs").upsert({
      id: p.id,
      tenant_id: p.tenantId,
      member_id: p.memberId,
      exercise_id: p.exerciseId,
      default_rest_sec: p.defaultRestSec,
      updated_at: p.updatedAt,
    });
    db.update(memberExercisePrefs)
      .set({ syncStatus: error ? "failed" : "synced" })
      .where(eq(memberExercisePrefs.id, p.id))
      .run();
  }
}

/** Count of rows still waiting to sync. */
export function pendingCount(): number {
  return selectPending(db.select().from(workouts).all()).length;
}

/** Full sync pass. Safe to call repeatedly; all writes are idempotent. */
export async function runSync(memberId: string): Promise<void> {
  try {
    await pullLibrary(memberId);
    await pushCustom();
    await pushWorkouts();
  } catch {
    // Local-first: a failed sync never surfaces an error to the UI.
  }
}
