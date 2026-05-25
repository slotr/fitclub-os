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

export type MuscleEnum =
  | "chest" | "back" | "shoulders" | "biceps" | "triceps"
  | "legs" | "glutes" | "core" | "fullBody";

export type MuscleSlice = { muscle: MuscleEnum; sets: number; pct: number };

export function computeMuscleSplit(
  sets: WorkoutSetRow[],
  exercises: { id: string; primaryMuscle: MuscleEnum }[],
  weeks: number = 4,
  now: Date = new Date(),
): MuscleSlice[] {
  const since = now.getTime() - weeks * 7 * 24 * 60 * 60 * 1000;
  const lookup = new Map(exercises.map((e) => [e.id, e.primaryMuscle]));
  const counts = new Map<MuscleEnum, number>();
  let total = 0;
  for (const s of sets) {
    if (s.isWarmup) continue;
    if (new Date(s.createdAt).getTime() < since) continue;
    const m = lookup.get(s.exerciseId) ?? "fullBody";
    counts.set(m, (counts.get(m) ?? 0) + 1);
    total += 1;
  }
  if (total === 0) return [];
  return [...counts.entries()]
    .map(([muscle, count]) => ({
      muscle,
      sets: count,
      pct: Math.round((count / total) * 1000) / 10,
    }))
    .sort((a, b) => b.pct - a.pct);
}

export type PbEntry = {
  setId: string;
  workoutId: string;
  exerciseId: string;
  exerciseName: string;
  weight: number;
  reps: number;
  estOneRepMax: number;
  createdAt: string;
};

export function listPbHistory(
  sets: WorkoutSetRow[],
  exercises: { id: string; name: string }[],
  limit?: number,
): PbEntry[] {
  const nameOf = new Map(exercises.map((e) => [e.id, e.name]));
  const out: PbEntry[] = [];
  for (const s of sets) {
    if (!s.isPr) continue;
    if (!s.weight || !s.reps) continue;
    out.push({
      setId: s.id,
      workoutId: s.workoutId,
      exerciseId: s.exerciseId,
      exerciseName: nameOf.get(s.exerciseId) ?? "Exercise",
      weight: s.weight,
      reps: s.reps,
      estOneRepMax: estimateOneRepMax(s.weight, s.reps),
      createdAt: s.createdAt,
    });
  }
  out.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return typeof limit === "number" ? out.slice(0, limit) : out;
}

export type Streak = { currentWeeks: number; longestWeeks: number };

export function computeStreak(
  workouts: WorkoutRow[],
  now: Date = new Date(),
): Streak {
  const weeks = new Set<string>();
  for (const w of workouts) {
    if (!w.finishedAt || w.deletedAt) continue;
    weeks.add(isoMonday(w.startedAt));
  }
  if (weeks.size === 0) return { currentWeeks: 0, longestWeeks: 0 };

  const sorted = [...weeks].sort();
  let longest = 1;
  let run = 1;
  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(`${sorted[i - 1]!}T00:00:00Z`);
    const cur = new Date(`${sorted[i]!}T00:00:00Z`);
    const diffWeeks = Math.round(
      (cur.getTime() - prev.getTime()) / (7 * 24 * 60 * 60 * 1000),
    );
    if (diffWeeks === 1) {
      run += 1;
      if (run > longest) longest = run;
    } else {
      run = 1;
    }
  }

  const thisWeek = isoMonday(now);
  let anchor = weeks.has(thisWeek) ? thisWeek : null;
  if (!anchor) {
    const last = new Date(`${thisWeek}T00:00:00Z`);
    last.setUTCDate(last.getUTCDate() - 7);
    const lastStr = last.toISOString().slice(0, 10);
    anchor = weeks.has(lastStr) ? lastStr : null;
  }
  let current = 0;
  if (anchor) {
    const cursor = new Date(`${anchor}T00:00:00Z`);
    while (weeks.has(cursor.toISOString().slice(0, 10))) {
      current += 1;
      cursor.setUTCDate(cursor.getUTCDate() - 7);
    }
  }

  return { currentWeeks: current, longestWeeks: longest };
}

export type Totals = {
  workouts: number;
  sets: number;
  volume: number;
  durationSec: number;
};

export function computeTotals(
  workouts: WorkoutRow[],
  sets: WorkoutSetRow[],
): Totals {
  let workoutCount = 0;
  let volume = 0;
  let durationSec = 0;
  for (const w of workouts) {
    if (!w.finishedAt || w.deletedAt) continue;
    workoutCount += 1;
    volume += Number(w.totalVolume ?? 0);
    durationSec += Number(w.durationSec ?? 0);
  }
  let nonWarmup = 0;
  for (const s of sets) {
    if (!s.isWarmup) nonWarmup += 1;
  }
  return { workouts: workoutCount, sets: nonWarmup, volume, durationSec };
}
