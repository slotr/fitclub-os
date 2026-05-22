import { describe, expect, it } from "vitest";
import { SEED_EXERCISES } from "../exercises";

describe("SEED_EXERCISES", () => {
  it("has at least 80 exercises", () => {
    expect(SEED_EXERCISES.length).toBeGreaterThanOrEqual(80);
  });

  it("every exercise has a unique slug", () => {
    const slugs = SEED_EXERCISES.map((e) => e.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("every exercise has valid muscle, equipment and metric", () => {
    const muscles = new Set([
      "chest", "back", "shoulders", "biceps", "triceps",
      "legs", "glutes", "core", "fullBody",
    ]);
    const equipment = new Set([
      "barbell", "dumbbell", "machine", "cable",
      "bodyweight", "kettlebell", "band", "other",
    ]);
    const metrics = new Set(["weight_reps", "reps_only", "time"]);
    for (const e of SEED_EXERCISES) {
      expect(muscles.has(e.primaryMuscle)).toBe(true);
      expect(equipment.has(e.equipment)).toBe(true);
      expect(metrics.has(e.metric)).toBe(true);
      expect(e.name.length).toBeGreaterThan(0);
      expect(e.defaultRestSec).toBeGreaterThan(0);
    }
  });
});
