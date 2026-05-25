import { describe, expect, it } from "vitest";
import { computeOneRepMaxSeries, computeWeeklyVolume } from "../progress";
import type { WorkoutRow, WorkoutSetRow } from "../types";

const set = (over: Partial<WorkoutSetRow>): WorkoutSetRow => ({
  id: "s", workoutId: "w", exerciseId: "e1", orderIndex: 0, setIndex: 0,
  weight: null, reps: null, durationSec: null, restSec: null,
  isWarmup: false, isPr: false, createdAt: "2026-01-01T00:00:00Z",
  ...over,
});

describe("computeOneRepMaxSeries", () => {
  it("returns one point per day with the max 1RM", () => {
    const sets = [
      set({ id: "a", weight: 80, reps: 8, createdAt: "2026-01-01T10:00:00Z" }),
      set({ id: "b", weight: 90, reps: 5, createdAt: "2026-01-01T11:00:00Z" }),
      set({ id: "c", weight: 85, reps: 5, createdAt: "2026-01-02T10:00:00Z" }),
    ];
    const out = computeOneRepMaxSeries(sets, "e1");
    expect(out).toHaveLength(2);
    expect(out[0]!.date).toBe("2026-01-01");
    expect(out[0]!.estOneRepMax).toBeCloseTo(105, 0); // 90*(1+5/30)
    expect(out[1]!.date).toBe("2026-01-02");
  });
  it("excludes warmups, null weight/reps, and other exercises", () => {
    const sets = [
      set({ id: "a", weight: 80, reps: 5, isWarmup: true }),
      set({ id: "b", weight: null, reps: 5 }),
      set({ id: "c", weight: 80, reps: null }),
      set({ id: "d", weight: 80, reps: 5, exerciseId: "other" }),
    ];
    expect(computeOneRepMaxSeries(sets, "e1")).toEqual([]);
  });
  it("returns ascending by date", () => {
    const sets = [
      set({ id: "a", weight: 80, reps: 5, createdAt: "2026-01-03T00:00:00Z" }),
      set({ id: "b", weight: 80, reps: 5, createdAt: "2026-01-01T00:00:00Z" }),
      set({ id: "c", weight: 80, reps: 5, createdAt: "2026-01-02T00:00:00Z" }),
    ];
    const out = computeOneRepMaxSeries(sets, "e1");
    expect(out.map((p) => p.date)).toEqual([
      "2026-01-01", "2026-01-02", "2026-01-03",
    ]);
  });
});

const workout = (over: Partial<WorkoutRow>): WorkoutRow => ({
  id: "w", tenantId: "t", memberId: "m", title: "Workout",
  startedAt: "2026-01-05T10:00:00Z", finishedAt: "2026-01-05T11:00:00Z",
  durationSec: 3600, totalVolume: 1000, notes: null,
  createdAt: "2026-01-05T10:00:00Z", updatedAt: "2026-01-05T11:00:00Z",
  deletedAt: null,
  ...over,
});

describe("computeWeeklyVolume", () => {
  it("returns one bucket per ISO week, oldest first", () => {
    const workouts = [
      workout({ id: "w1", startedAt: "2026-01-05T10:00:00Z", totalVolume: 1000 }),
      workout({ id: "w2", startedAt: "2026-01-07T10:00:00Z", totalVolume: 500 }),
      workout({ id: "w3", startedAt: "2026-01-12T10:00:00Z", totalVolume: 2000 }),
    ];
    const out = computeWeeklyVolume(workouts, [], 3, new Date("2026-01-12T12:00:00Z"));
    expect(out.length).toBe(3);
    const last = out[out.length - 1]!;
    expect(last.weekStart).toBe("2026-01-12");
    expect(last.volume).toBe(2000);
    expect(last.workoutCount).toBe(1);
    const prev = out[out.length - 2]!;
    expect(prev.weekStart).toBe("2026-01-05");
    expect(prev.volume).toBe(1500);
    expect(prev.workoutCount).toBe(2);
  });
  it("fills empty weeks with zeros", () => {
    const workouts = [workout({ startedAt: "2026-01-05T10:00:00Z", totalVolume: 1000 })];
    const out = computeWeeklyVolume(workouts, [], 3, new Date("2026-01-19T12:00:00Z"));
    expect(out.length).toBe(3);
    expect(out.some((p) => p.weekStart === "2026-01-05" && p.volume === 1000)).toBe(true);
    expect(out.some((p) => p.weekStart === "2026-01-12" && p.volume === 0 && p.workoutCount === 0)).toBe(true);
    expect(out.some((p) => p.weekStart === "2026-01-19" && p.volume === 0)).toBe(true);
  });
  it("excludes unfinished or deleted workouts", () => {
    const workouts = [
      workout({ id: "ok", startedAt: "2026-01-05T10:00:00Z", totalVolume: 1000 }),
      workout({ id: "open", startedAt: "2026-01-05T10:00:00Z", totalVolume: 0, finishedAt: null }),
      workout({ id: "del", startedAt: "2026-01-05T10:00:00Z", totalVolume: 999, deletedAt: "2026-01-06T00:00:00Z" }),
    ];
    const out = computeWeeklyVolume(workouts, [], 1, new Date("2026-01-05T12:00:00Z"));
    const slot = out[0]!;
    expect(slot.volume).toBe(1000);
    expect(slot.workoutCount).toBe(1);
  });
});
