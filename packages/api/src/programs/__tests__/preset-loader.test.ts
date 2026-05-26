import { describe, it, expect } from "vitest";
import { presetProgramSchema, PRESET_LEVELS, PRESET_GOALS } from "../preset-schema";
import { PRESETS, PRESETS_BY_SLUG, getPreset } from "../preset-loader";

describe("preset-schema", () => {
  it("PRESET_LEVELS = 3 values", () => {
    expect(PRESET_LEVELS).toEqual(["beginner", "intermediate", "advanced"]);
  });

  it("PRESET_GOALS = 5 values", () => {
    expect(PRESET_GOALS).toEqual(["strength","hypertrophy","cardio","bodyweight","general"]);
  });

  it("rejects program when days count mismatches weeks*daysPerWeek", () => {
    expect(() => presetProgramSchema.parse({
      slug: "test",
      name: "Test",
      description: "x",
      authorCredit: null,
      weeks: 2,
      daysPerWeek: 3,
      level: "beginner",
      goal: "strength",
      tags: [],
      equipmentNeeded: [],
      days: [
        { week: 1, day: 1, title: "A", isRest: false, exercises: [] },
      ],
    })).toThrow(/days count/);
  });

  it("accepts a valid 1-week 1-day program", () => {
    const r = presetProgramSchema.parse({
      slug: "test-1d",
      name: "Test",
      description: "x",
      authorCredit: null,
      weeks: 1,
      daysPerWeek: 1,
      level: "beginner",
      goal: "general",
      tags: [],
      equipmentNeeded: [],
      days: [
        { week: 1, day: 1, title: "A", isRest: false, exercises: [
          { exerciseSlug: "push-up", sets: 3, repMin: 10, repMax: 15,
            restSeconds: 60, targetRpe: null, target1rmPct: null,
            tempo: null, supersetGroup: null, notes: null },
        ]},
      ],
    });
    expect(r.days[0]!.title).toBe("A");
  });

  it("rejects bad slug (uppercase)", () => {
    expect(() => presetProgramSchema.parse({
      slug: "BadSlug",
      name: "x",
      description: "x",
      authorCredit: null,
      weeks: 1, daysPerWeek: 1,
      level: "beginner", goal: "general",
      tags: [], equipmentNeeded: [],
      days: [{ week: 1, day: 1, title: "A", isRest: true, exercises: [] }],
    })).toThrow();
  });
});

describe("preset-loader integration (first 5)", () => {
  it("loads exactly 5 presets", () => {
    expect(PRESETS).toHaveLength(5);
  });
  it("indexes by slug", () => {
    expect(getPreset("stronglifts-5x5")?.name).toBe("StrongLifts 5×5");
    expect(getPreset("ppl-6day")?.daysPerWeek).toBe(6);
  });
  it("all preset days arrays match weeks*daysPerWeek", () => {
    for (const p of PRESETS) {
      expect(p.days.length).toBe(p.weeks * p.daysPerWeek);
    }
  });
});
