import { getTableColumns } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { memberExercisePrefs } from "../memberExercisePrefs";
import { workouts } from "../workouts";
import { workoutSets } from "../workoutSets";

describe("workout schema", () => {
  it("workouts declares required columns", () => {
    expect(Object.keys(getTableColumns(workouts))).toEqual(
      expect.arrayContaining([
        "id",
        "tenantId",
        "memberId",
        "title",
        "startedAt",
        "finishedAt",
        "durationSec",
        "totalVolume",
        "notes",
        "createdAt",
        "updatedAt",
        "deletedAt",
      ]),
    );
  });

  it("workoutSets declares required columns", () => {
    expect(Object.keys(getTableColumns(workoutSets))).toEqual(
      expect.arrayContaining([
        "id",
        "workoutId",
        "exerciseId",
        "orderIndex",
        "setIndex",
        "weight",
        "reps",
        "durationSec",
        "restSec",
        "isWarmup",
        "isPr",
        "createdAt",
      ]),
    );
  });

  it("memberExercisePrefs declares required columns", () => {
    expect(Object.keys(getTableColumns(memberExercisePrefs))).toEqual(
      expect.arrayContaining([
        "id",
        "tenantId",
        "memberId",
        "exerciseId",
        "defaultRestSec",
        "createdAt",
        "updatedAt",
      ]),
    );
  });
});
