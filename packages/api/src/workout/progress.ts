import { estimateOneRepMax } from "./oneRepMax";
import type { WorkoutSetRow } from "./types";

export type DailyOneRepMax = { date: string; estOneRepMax: number };

const dayKey = (iso: string): string => iso.slice(0, 10);

export function computeOneRepMaxSeries(
  sets: WorkoutSetRow[],
  exerciseId: string,
): DailyOneRepMax[] {
  const byDay = new Map<string, number>();
  for (const s of sets) {
    if (s.exerciseId !== exerciseId) continue;
    if (s.isWarmup) continue;
    const est = estimateOneRepMax(s.weight, s.reps);
    if (est <= 0) continue;
    const d = dayKey(s.createdAt);
    const prev = byDay.get(d) ?? 0;
    if (est > prev) byDay.set(d, est);
  }
  return [...byDay.entries()]
    .map(([date, estOneRepMax]) => ({ date, estOneRepMax }))
    .sort((a, b) => a.date.localeCompare(b.date));
}
