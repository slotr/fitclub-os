import type { WorkoutSetRow } from "./types";

/** weight x reps for a single set; 0 unless both are present. */
export function setVolume(s: WorkoutSetRow): number {
  if (!s.weight || !s.reps) return 0;
  return s.weight * s.reps;
}

/** Sum of set volume across all non-warmup sets. */
export function totalVolume(sets: WorkoutSetRow[]): number {
  return sets
    .filter((s) => !s.isWarmup)
    .reduce((sum, s) => sum + setVolume(s), 0);
}

export type WorkoutSummary = {
  durationSec: number;
  totalVolume: number;
};

/** Duration (seconds) + total volume for a finished workout. */
export function summariseWorkout(
  startedAt: string,
  finishedAt: string,
  sets: WorkoutSetRow[],
): WorkoutSummary {
  const durationMs =
    new Date(finishedAt).getTime() - new Date(startedAt).getTime();
  return {
    durationSec: Math.max(0, Math.round(durationMs / 1000)),
    totalVolume: totalVolume(sets),
  };
}
