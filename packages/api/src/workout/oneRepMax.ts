import type { WorkoutSetRow } from "./types";

/** Epley estimated 1RM. Returns 0 when inputs are not usable. */
export function estimateOneRepMax(
  weight: number | null,
  reps: number | null,
): number {
  if (!weight || !reps || weight <= 0 || reps <= 0) return 0;
  if (reps === 1) return weight;
  return weight * (1 + reps / 30);
}

/**
 * Returns the ids of `current` sets that set a new estimated-1RM PR for
 * their exercise, compared against `history` (all prior sets, any workout).
 * Warmup sets never count. The first-ever set of an exercise is not a PR.
 */
export function detectPrSets(
  current: WorkoutSetRow[],
  history: WorkoutSetRow[],
): string[] {
  const bestByExercise = new Map<string, number>();
  for (const h of history) {
    if (h.isWarmup) continue;
    const e = estimateOneRepMax(h.weight, h.reps);
    bestByExercise.set(
      h.exerciseId,
      Math.max(bestByExercise.get(h.exerciseId) ?? 0, e),
    );
  }

  const prIds: string[] = [];
  // Process current sets oldest-first so a later set in the same session
  // must beat an earlier PR set too.
  const ordered = [...current].sort(
    (a, b) => a.orderIndex - b.orderIndex || a.setIndex - b.setIndex,
  );
  for (const s of ordered) {
    if (s.isWarmup) continue;
    const e = estimateOneRepMax(s.weight, s.reps);
    if (e <= 0) continue;
    const prior = bestByExercise.get(s.exerciseId);
    if (prior !== undefined && e > prior) {
      prIds.push(s.id);
    }
    bestByExercise.set(s.exerciseId, Math.max(prior ?? 0, e));
  }
  return prIds;
}
