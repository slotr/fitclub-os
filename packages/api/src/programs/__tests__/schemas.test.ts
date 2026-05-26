import { describe, it, expect } from "vitest";
import {
  workoutTemplateInputSchema,
  templateExerciseInputSchema,
  programInputSchema,
  programDayInputSchema,
  PROGRAM_STATUSES,
} from "../programs";
import { templateExerciseInputSchema as alsoTpl } from "../templates";

describe("templateExerciseInputSchema", () => {
  it("accepts a minimal valid exercise", () => {
    const r = templateExerciseInputSchema.parse({
      exerciseId: "11111111-1111-1111-1111-111111111111",
      position: 0,
      sets: 3,
    });
    expect(r.sets).toBe(3);
    expect(r.repMin).toBeNull();
  });

  it("rejects sets <= 0", () => {
    expect(() => templateExerciseInputSchema.parse({
      exerciseId: "11111111-1111-1111-1111-111111111111",
      position: 0,
      sets: 0,
    })).toThrow();
  });

  it("rejects repMax < repMin", () => {
    expect(() => templateExerciseInputSchema.parse({
      exerciseId: "11111111-1111-1111-1111-111111111111",
      position: 0,
      sets: 3,
      repMin: 12,
      repMax: 8,
    })).toThrow();
  });

  it("allows null rep range", () => {
    const r = templateExerciseInputSchema.parse({
      exerciseId: "11111111-1111-1111-1111-111111111111",
      position: 0,
      sets: 3,
      repMin: null,
      repMax: null,
    });
    expect(r.repMin).toBeNull();
  });
});

describe("workoutTemplateInputSchema", () => {
  it("requires at least one exercise on save", () => {
    expect(() => workoutTemplateInputSchema.parse({
      name: "Push",
      exercises: [],
    })).toThrow();
  });

  it("accepts trimmed name and exercises", () => {
    const r = workoutTemplateInputSchema.parse({
      name: "Push",
      exercises: [{
        exerciseId: "11111111-1111-1111-1111-111111111111",
        position: 0,
        sets: 3,
      }],
    });
    expect(r.name).toBe("Push");
  });

  it("rejects empty name", () => {
    expect(() => workoutTemplateInputSchema.parse({
      name: "",
      exercises: [{
        exerciseId: "11111111-1111-1111-1111-111111111111",
        position: 0,
        sets: 3,
      }],
    })).toThrow();
  });
});

describe("programInputSchema", () => {
  it("PROGRAM_STATUSES has 4 values", () => {
    expect(PROGRAM_STATUSES).toEqual(["draft","active","paused","completed"]);
  });

  it("accepts valid input", () => {
    const r = programInputSchema.parse({
      name: "PPL",
      weeksCount: 6,
      daysPerWeek: 3,
    });
    expect(r.weeksCount).toBe(6);
  });

  it("rejects daysPerWeek > 7", () => {
    expect(() => programInputSchema.parse({
      name: "X",
      weeksCount: 4,
      daysPerWeek: 8,
    })).toThrow();
  });

  it("rejects weeksCount = 0", () => {
    expect(() => programInputSchema.parse({
      name: "X",
      weeksCount: 0,
      daysPerWeek: 3,
    })).toThrow();
  });
});

describe("programDayInputSchema", () => {
  it("rest day allows null templateId", () => {
    const r = programDayInputSchema.parse({
      week: 1,
      day: 2,
      position: 1,
      title: "Rest",
      templateId: null,
      isRest: true,
    });
    expect(r.isRest).toBe(true);
  });

  it("non-rest day requires templateId", () => {
    expect(() => programDayInputSchema.parse({
      week: 1,
      day: 1,
      position: 0,
      title: "Push",
      templateId: null,
      isRest: false,
    })).toThrow();
  });
});

describe("templates re-export", () => {
  it("templates.ts exports same schema", () => {
    expect(alsoTpl).toBe(templateExerciseInputSchema);
  });
});
