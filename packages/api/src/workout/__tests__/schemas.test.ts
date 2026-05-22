import { describe, expect, it } from "vitest";
import { backupFileSchema, workoutSetInputSchema } from "../schemas";

describe("workoutSetInputSchema", () => {
  it("accepts a valid weight_reps set", () => {
    const r = workoutSetInputSchema.safeParse({
      exerciseId: "e1",
      orderIndex: 0,
      setIndex: 0,
      weight: 60,
      reps: 10,
      isWarmup: false,
    });
    expect(r.success).toBe(true);
  });

  it("rejects negative reps", () => {
    const r = workoutSetInputSchema.safeParse({
      exerciseId: "e1",
      orderIndex: 0,
      setIndex: 0,
      reps: -1,
    });
    expect(r.success).toBe(false);
  });
});

describe("backupFileSchema", () => {
  it("rejects an unknown version", () => {
    const r = backupFileSchema.safeParse({
      version: 99,
      exportedAt: new Date().toISOString(),
      memberId: "m1",
      exercises: [],
      memberPrefs: [],
      workouts: [],
      sets: [],
    });
    expect(r.success).toBe(false);
  });
});
