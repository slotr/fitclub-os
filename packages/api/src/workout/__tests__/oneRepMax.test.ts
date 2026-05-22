import { describe, expect, it } from "vitest";
import { estimateOneRepMax, detectPrSets } from "../oneRepMax";
import type { WorkoutSetRow } from "../types";

const set = (over: Partial<WorkoutSetRow>): WorkoutSetRow => ({
  id: "s", workoutId: "w", exerciseId: "e1", orderIndex: 0, setIndex: 0,
  weight: null, reps: null, durationSec: null, restSec: null,
  isWarmup: false, isPr: false, createdAt: "2026-05-21T00:00:00Z",
  ...over,
});

describe("estimateOneRepMax", () => {
  it("returns the weight for a single rep", () => {
    expect(estimateOneRepMax(100, 1)).toBe(100);
  });
  it("applies the Epley formula for multiple reps", () => {
    // 100 * (1 + 10/30) = 133.33
    expect(estimateOneRepMax(100, 10)).toBeCloseTo(133.33, 1);
  });
  it("returns 0 when weight or reps are missing", () => {
    expect(estimateOneRepMax(null, 5)).toBe(0);
    expect(estimateOneRepMax(80, 0)).toBe(0);
  });
});

describe("detectPrSets", () => {
  it("flags a set that beats the prior best 1RM", () => {
    const history = [set({ id: "h1", weight: 80, reps: 5 })]; // 1RM ~93.3
    const current = [set({ id: "c1", weight: 100, reps: 5 })]; // 1RM ~116.7
    const prIds = detectPrSets(current, history);
    expect(prIds).toEqual(["c1"]);
  });
  it("flags nothing when there is no improvement", () => {
    const history = [set({ id: "h1", weight: 100, reps: 5 })];
    const current = [set({ id: "c1", weight: 60, reps: 5 })];
    expect(detectPrSets(current, history)).toEqual([]);
  });
  it("does not flag the first-ever set of an exercise", () => {
    const current = [set({ id: "c1", weight: 60, reps: 5 })];
    expect(detectPrSets(current, [])).toEqual([]);
  });
  it("ignores warmup sets", () => {
    const current = [set({ id: "c1", weight: 200, reps: 5, isWarmup: true })];
    expect(detectPrSets(current, [])).toEqual([]);
  });
});
