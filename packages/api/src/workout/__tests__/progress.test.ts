import { describe, expect, it } from "vitest";
import { computeOneRepMaxSeries } from "../progress";
import type { WorkoutSetRow } from "../types";

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
