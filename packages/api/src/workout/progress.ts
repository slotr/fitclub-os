import { estimateOneRepMax } from "./oneRepMax";
import type { WorkoutRow, WorkoutSetRow } from "./types";

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

export type WeeklyPoint = {
  weekStart: string;
  volume: number;
  workoutCount: number;
};

/** UTC Monday of the ISO week containing `iso`, formatted as YYYY-MM-DD. */
function isoMonday(iso: string | Date): string {
  const d = typeof iso === "string" ? new Date(iso) : iso;
  const day = d.getUTCDay(); // 0..6 (Sun..Sat)
  const offset = (day + 6) % 7; // Mon=0
  const monday = new Date(Date.UTC(
    d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - offset,
  ));
  return monday.toISOString().slice(0, 10);
}

export function computeWeeklyVolume(
  workouts: WorkoutRow[],
  _sets: WorkoutSetRow[],
  weeks: number = 8,
  now: Date = new Date(),
): WeeklyPoint[] {
  const buckets = new Map<string, WeeklyPoint>();
  const currentMondayStr = isoMonday(now);
  for (let i = weeks - 1; i >= 0; i--) {
    const cur = new Date(`${currentMondayStr}T00:00:00Z`);
    cur.setUTCDate(cur.getUTCDate() - i * 7);
    const key = cur.toISOString().slice(0, 10);
    buckets.set(key, { weekStart: key, volume: 0, workoutCount: 0 });
  }
  for (const w of workouts) {
    if (!w.finishedAt) continue;
    if (w.deletedAt) continue;
    const wk = isoMonday(w.startedAt);
    const slot = buckets.get(wk);
    if (!slot) continue;
    slot.volume += Number(w.totalVolume ?? 0);
    slot.workoutCount += 1;
  }
  return [...buckets.values()].sort((a, b) =>
    a.weekStart.localeCompare(b.weekStart),
  );
}
