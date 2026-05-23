import { describe, expect, it } from "vitest";
import { deriveDefaultRest, deriveMetric } from "../heuristics";

describe("deriveMetric", () => {
  it("returns time for stretching", () => {
    expect(deriveMetric({ category: "stretching", equipment: null, name: "x" })).toBe("time");
  });
  it("returns time for cardio", () => {
    expect(deriveMetric({ category: "cardio", equipment: "machine", name: "Treadmill" })).toBe("time");
  });
  it("returns time for body-only strength holds (Plank, Wall Sit, Dead Hang)", () => {
    expect(deriveMetric({ category: "strength", equipment: "body only", name: "Plank" })).toBe("time");
    expect(deriveMetric({ category: "strength", equipment: "body only", name: "Wall Sit" })).toBe("time");
    expect(deriveMetric({ category: "strength", equipment: "body only", name: "Dead Hang" })).toBe("time");
    expect(deriveMetric({ category: "strength", equipment: "body only", name: "Hollow Body Hold" })).toBe("time");
  });
  it("returns reps_only for other body-only strength", () => {
    expect(deriveMetric({ category: "strength", equipment: "body only", name: "Push-Up" })).toBe("reps_only");
    expect(deriveMetric({ category: "strength", equipment: "body only", name: "Pull-up" })).toBe("reps_only");
  });
  it("returns weight_reps for loaded strength work", () => {
    expect(deriveMetric({ category: "strength", equipment: "barbell", name: "Bench Press" })).toBe("weight_reps");
    expect(deriveMetric({ category: "powerlifting", equipment: "barbell", name: "Squat" })).toBe("weight_reps");
    expect(deriveMetric({ category: "strongman", equipment: "barbell", name: "Deadlift" })).toBe("weight_reps");
  });
});

describe("deriveDefaultRest", () => {
  it("powerlifting → 180s", () => {
    expect(deriveDefaultRest({ category: "powerlifting", mechanic: "compound" })).toBe(180);
  });
  it("compound strength → 150s", () => {
    expect(deriveDefaultRest({ category: "strength", mechanic: "compound" })).toBe(150);
  });
  it("isolation → 90s", () => {
    expect(deriveDefaultRest({ category: "strength", mechanic: "isolation" })).toBe(90);
  });
  it("cardio and stretching → 60s", () => {
    expect(deriveDefaultRest({ category: "cardio", mechanic: null })).toBe(60);
    expect(deriveDefaultRest({ category: "stretching", mechanic: null })).toBe(60);
  });
  it("falls back to 120s when nothing else fits", () => {
    expect(deriveDefaultRest({ category: "plyometrics", mechanic: null })).toBe(120);
    expect(deriveDefaultRest({ category: null, mechanic: null })).toBe(120);
  });
});
