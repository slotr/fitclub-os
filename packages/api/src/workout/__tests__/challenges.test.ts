import { describe, expect, it } from "vitest";
import {
  CHALLENGE_METRIC_TYPES, CHALLENGE_STATUSES,
  challengeInputSchema, type ChallengeMetricType,
} from "../challenges";

describe("CHALLENGE_METRIC_TYPES", () => {
  it("exposes the four supported metric types", () => {
    expect(CHALLENGE_METRIC_TYPES).toEqual([
      "volume", "workout_count", "max_weight", "streak_weeks",
    ]);
  });
});

describe("CHALLENGE_STATUSES", () => {
  it("exposes the four lifecycle statuses", () => {
    expect(CHALLENGE_STATUSES).toEqual([
      "draft", "active", "ended", "cancelled",
    ]);
  });
});

describe("challengeInputSchema", () => {
  const base = {
    name: "May Volume Push",
    metricType: "volume" as ChallengeMetricType,
    startsAt: "2026-05-01T00:00:00Z",
    endsAt: "2026-05-31T23:59:59Z",
  };

  it("accepts a minimal valid input", () => {
    expect(challengeInputSchema.safeParse(base).success).toBe(true);
  });
  it("rejects an empty name", () => {
    expect(
      challengeInputSchema.safeParse({ ...base, name: "" }).success,
    ).toBe(false);
  });
  it("rejects endsAt at or before startsAt", () => {
    expect(
      challengeInputSchema.safeParse({
        ...base, endsAt: "2026-04-30T00:00:00Z",
      }).success,
    ).toBe(false);
    expect(
      challengeInputSchema.safeParse({
        ...base, endsAt: base.startsAt,
      }).success,
    ).toBe(false);
  });
  it("rejects max_weight without an exerciseId", () => {
    expect(
      challengeInputSchema.safeParse({
        ...base, metricType: "max_weight",
      }).success,
    ).toBe(false);
  });
  it("accepts max_weight with an exerciseId", () => {
    expect(
      challengeInputSchema.safeParse({
        ...base,
        metricType: "max_weight",
        exerciseId: "00000000-0000-0000-0000-000000000000",
      }).success,
    ).toBe(true);
  });
});
