import { and, desc, eq, isNull, or } from "drizzle-orm";
import { db } from "./client";
import {
  exercises,
  memberExercisePrefs,
  workouts,
  workoutSets,
  type LocalExercise,
  type LocalWorkout,
  type LocalWorkoutSet,
} from "./schema";

export const now = (): string => new Date().toISOString();

// ---------- Exercises ----------

export function listExercises(memberId: string): LocalExercise[] {
  return db
    .select()
    .from(exercises)
    .where(
      and(
        isNull(exercises.deletedAt),
        or(isNull(exercises.memberId), eq(exercises.memberId, memberId)),
      ),
    )
    .all();
}

export function getExercise(id: string): LocalExercise | undefined {
  return db.select().from(exercises).where(eq(exercises.id, id)).get();
}

export function upsertExercise(row: LocalExercise): void {
  db.insert(exercises).values(row).onConflictDoUpdate({
    target: exercises.id,
    set: row,
  }).run();
}

// ---------- Workouts ----------

export function getActiveWorkout(): LocalWorkout | undefined {
  return db
    .select()
    .from(workouts)
    .where(eq(workouts.isActive, 1))
    .get();
}

export function listWorkouts(
  memberId: string,
  limit = 30,
): LocalWorkout[] {
  return db
    .select()
    .from(workouts)
    .where(
      and(
        eq(workouts.memberId, memberId),
        eq(workouts.isActive, 0),
        isNull(workouts.deletedAt),
      ),
    )
    .orderBy(desc(workouts.startedAt))
    .limit(limit)
    .all();
}

export function getWorkout(id: string): LocalWorkout | undefined {
  return db.select().from(workouts).where(eq(workouts.id, id)).get();
}

export function insertWorkout(row: LocalWorkout): void {
  db.insert(workouts).values(row).run();
}

export function updateWorkout(
  id: string,
  patch: Partial<LocalWorkout>,
): void {
  db.update(workouts)
    .set({ ...patch, updatedAt: now() })
    .where(eq(workouts.id, id))
    .run();
}

export function deleteWorkout(id: string): void {
  db.delete(workoutSets).where(eq(workoutSets.workoutId, id)).run();
  db.delete(workouts).where(eq(workouts.id, id)).run();
}

// ---------- Workout sets ----------

export function listSets(workoutId: string): LocalWorkoutSet[] {
  return db
    .select()
    .from(workoutSets)
    .where(eq(workoutSets.workoutId, workoutId))
    .all();
}

/** All historical non-warmup sets for PR comparison. */
export function listAllSetsForMember(memberId: string): LocalWorkoutSet[] {
  const ids = listWorkouts(memberId, 9999).map((w) => w.id);
  if (ids.length === 0) return [];
  return ids.flatMap((id) => listSets(id));
}

export function upsertSet(row: LocalWorkoutSet): void {
  db.insert(workoutSets).values(row).onConflictDoUpdate({
    target: workoutSets.id,
    set: row,
  }).run();
}

export function deleteSet(id: string): void {
  db.delete(workoutSets).where(eq(workoutSets.id, id)).run();
}

// ---------- Prefs ----------

export function getPref(
  memberId: string,
  exerciseId: string,
): number | undefined {
  const row = db
    .select()
    .from(memberExercisePrefs)
    .where(
      and(
        eq(memberExercisePrefs.memberId, memberId),
        eq(memberExercisePrefs.exerciseId, exerciseId),
      ),
    )
    .get();
  return row?.defaultRestSec;
}

export function setPref(
  id: string,
  tenantId: string,
  memberId: string,
  exerciseId: string,
  defaultRestSec: number,
): void {
  db.insert(memberExercisePrefs)
    .values({
      id,
      tenantId,
      memberId,
      exerciseId,
      defaultRestSec,
      createdAt: now(),
      updatedAt: now(),
      syncStatus: "pending",
    })
    .onConflictDoUpdate({
      target: memberExercisePrefs.id,
      set: { defaultRestSec, updatedAt: now(), syncStatus: "pending" },
    })
    .run();
}
