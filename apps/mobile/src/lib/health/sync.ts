import * as SecureStore from "expo-secure-store";
import { and, eq, isNotNull, lt } from "drizzle-orm";
import { db } from "../../db/client";
import { workouts } from "../../db/schema";
import {
  isHealthAvailable,
  writeWorkoutToHealth,
} from "./index";
import type { HealthWorkoutPayload, HealthSyncSummary } from "./types";
import { HEALTH_OPT_IN_KEY } from "./storage-keys";
import { isHealthSyncFeatureEnabled } from "./feature-flag";

const MAX_ATTEMPTS = 3;

export function estimateKcal(durationSec: number): number {
  return Math.round((durationSec / 60) * 5);
}

export function toPayload(
  w: typeof workouts.$inferSelect,
): HealthWorkoutPayload {
  return {
    workoutId: w.id,
    startedAt: w.startedAt,
    finishedAt: w.finishedAt ?? w.startedAt,
    durationSec: w.durationSec,
    totalEnergyKcal: estimateKcal(w.durationSec),
    exerciseType: "strength_training",
    notes: w.notes,
  };
}

async function isOptInActive(): Promise<boolean> {
  const optIn = await SecureStore.getItemAsync(HEALTH_OPT_IN_KEY).catch(
    () => null,
  );
  return optIn === "true";
}

export async function attemptHealthWriteAsync(
  workoutId: string,
): Promise<void> {
  if (!(await isHealthSyncFeatureEnabled())) return;
  if (!(await isOptInActive())) return;
  if (!(await isHealthAvailable())) return;

  const row = db
    .select()
    .from(workouts)
    .where(eq(workouts.id, workoutId))
    .all()[0];
  if (!row || row.healthSynced === 1) return;
  if (row.healthAttempts >= MAX_ATTEMPTS) return;
  if (!row.finishedAt) return;

  const result = await writeWorkoutToHealth(toPayload(row));
  const now = new Date().toISOString();

  if (result.ok) {
    db.update(workouts)
      .set({
        healthSynced: 1,
        healthUuid: result.recordId,
        updatedAt: now,
      })
      .where(eq(workouts.id, workoutId))
      .run();
  } else {
    db.update(workouts)
      .set({
        healthAttempts: row.healthAttempts + 1,
        updatedAt: now,
      })
      .where(eq(workouts.id, workoutId))
      .run();
    console.warn("Health write failed:", result.error);
  }
}

export async function syncPendingHealthWorkouts(): Promise<HealthSyncSummary> {
  if (!(await isHealthSyncFeatureEnabled())) {
    return { total: 0, synced: 0, failed: 0 };
  }
  if (!(await isOptInActive())) {
    return { total: 0, synced: 0, failed: 0 };
  }
  if (!(await isHealthAvailable())) {
    return { total: 0, synced: 0, failed: 0 };
  }

  const pending = db
    .select()
    .from(workouts)
    .where(
      and(
        eq(workouts.healthSynced, 0),
        isNotNull(workouts.finishedAt),
        lt(workouts.healthAttempts, MAX_ATTEMPTS),
      ),
    )
    .all();

  let synced = 0;
  let failed = 0;
  for (const w of pending) {
    const result = await writeWorkoutToHealth(toPayload(w));
    const now = new Date().toISOString();
    if (result.ok) {
      db.update(workouts)
        .set({
          healthSynced: 1,
          healthUuid: result.recordId,
          updatedAt: now,
        })
        .where(eq(workouts.id, w.id))
        .run();
      synced++;
    } else {
      db.update(workouts)
        .set({
          healthAttempts: w.healthAttempts + 1,
          updatedAt: now,
        })
        .where(eq(workouts.id, w.id))
        .run();
      failed++;
    }
  }
  return { total: pending.length, synced, failed };
}

export function countPendingHealthSync(memberId: string): number {
  return db
    .select()
    .from(workouts)
    .where(
      and(
        eq(workouts.memberId, memberId),
        eq(workouts.healthSynced, 0),
        isNotNull(workouts.finishedAt),
        lt(workouts.healthAttempts, MAX_ATTEMPTS),
      ),
    )
    .all().length;
}

export async function backfillHealthWorkouts(
  memberId: string,
): Promise<{ total: number; synced: number }> {
  if (!(await isHealthSyncFeatureEnabled())) {
    return { total: 0, synced: 0 };
  }
  if (!(await isOptInActive())) {
    return { total: 0, synced: 0 };
  }
  if (!(await isHealthAvailable())) {
    return { total: 0, synced: 0 };
  }

  const all = db
    .select()
    .from(workouts)
    .where(
      and(
        eq(workouts.memberId, memberId),
        eq(workouts.healthSynced, 0),
        isNotNull(workouts.finishedAt),
      ),
    )
    .all();

  let synced = 0;
  for (const w of all) {
    const result = await writeWorkoutToHealth(toPayload(w));
    const now = new Date().toISOString();
    if (result.ok) {
      db.update(workouts)
        .set({
          healthSynced: 1,
          healthUuid: result.recordId,
          healthAttempts: 0,
          updatedAt: now,
        })
        .where(eq(workouts.id, w.id))
        .run();
      synced++;
    } else {
      db.update(workouts)
        .set({
          healthAttempts: w.healthAttempts + 1,
        })
        .where(eq(workouts.id, w.id))
        .run();
    }
  }
  return { total: all.length, synced };
}
