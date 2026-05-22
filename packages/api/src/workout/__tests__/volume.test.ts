import { describe, expect, it } from "vitest";
import { setVolume, totalVolume, summariseWorkout } from "../volume";
import type { WorkoutSetRow } from "../types";

const set = (over: Partial<WorkoutSetRow>): WorkoutSetRow => ({
  id: "s", workoutId: "w", exerciseId: "e1", orderIndex: 0, setIndex: 0,
  weight: null, reps: null, durationSec: null, restSec: null,
  isWarmup: false, isPr: false, createdAt: "2026-05-21T00:00:00Z",
  ...over,
});

describe("setVolume", () => {
  it("multiplies weight by reps", () => {
    expect(setVolume(set({ weight: 60, reps: 10 }))).toBe(600);
  });
  it("is 0 for time/reps-only sets", () => {
    expect(setVolume(set({ durationSec: 60 }))).toBe(0);
    expect(setVolume(set({ reps: 12 }))).toBe(0);
  });
});

describe("totalVolume", () => {
  it("sums non-warmup sets", () => {
    const sets = [
      set({ weight: 60, reps: 10 }),
      set({ weight: 50, reps: 10, isWarmup: true }),
    ];
    expect(totalVolume(sets)).toBe(600);
  });
});

describe("summariseWorkout", () => {
  it("computes duration and volume", () => {
    const s = summariseWorkout(
      "2026-05-21T10:00:00Z",
      "2026-05-21T10:45:00Z",
      [set({ weight: 60, reps: 10 })],
    );
    expect(s.durationSec).toBe(2700);
    expect(s.totalVolume).toBe(600);
  });
});
