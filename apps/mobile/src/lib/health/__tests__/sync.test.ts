import { describe, it, expect, vi } from "vitest";

vi.mock("../../../db/client", () => ({
  db: {
    select: () => ({
      from: () => ({
        where: () => ({
          all: () => [],
        }),
      }),
    }),
    update: () => ({
      set: () => ({
        where: () => ({
          run: () => undefined,
        }),
      }),
    }),
  },
}));

vi.mock("../index", () => ({
  isHealthAvailable: vi.fn(async () => false),
  writeWorkoutToHealth: vi.fn(async () => ({ ok: false, error: "stub" })),
}));

vi.mock("../feature-flag", () => ({
  isHealthSyncFeatureEnabled: vi.fn(async () => true),
}));

vi.mock("expo-secure-store", () => ({
  getItemAsync: vi.fn(async () => "false"),
  setItemAsync: vi.fn(async () => undefined),
  deleteItemAsync: vi.fn(async () => undefined),
}));

import { estimateKcal, toPayload } from "../sync";

describe("estimateKcal", () => {
  it("returns 0 for 0 seconds", () => {
    expect(estimateKcal(0)).toBe(0);
  });
  it("returns 5 for 60 seconds", () => {
    expect(estimateKcal(60)).toBe(5);
  });
  it("returns 30 for 6 minutes", () => {
    expect(estimateKcal(360)).toBe(30);
  });
  it("rounds to integer", () => {
    expect(estimateKcal(30)).toBe(3); // 0.5 min * 5 = 2.5 → 3
  });
});

describe("toPayload", () => {
  it("maps a workout row to health payload", () => {
    const row = {
      id: "w-1",
      startedAt: "2026-05-28T10:00:00Z",
      finishedAt: "2026-05-28T10:45:00Z",
      durationSec: 2700,
      notes: "Hard session",
    } as never;
    const payload = toPayload(row);
    expect(payload).toEqual({
      workoutId: "w-1",
      startedAt: "2026-05-28T10:00:00Z",
      finishedAt: "2026-05-28T10:45:00Z",
      durationSec: 2700,
      totalEnergyKcal: 225,
      exerciseType: "strength_training",
      notes: "Hard session",
    });
  });

  it("falls back to startedAt when finishedAt missing", () => {
    const row = {
      id: "w-2",
      startedAt: "2026-05-28T10:00:00Z",
      finishedAt: null,
      durationSec: 0,
      notes: null,
    } as never;
    const payload = toPayload(row);
    expect(payload.finishedAt).toBe("2026-05-28T10:00:00Z");
    expect(payload.notes).toBeNull();
    expect(payload.totalEnergyKcal).toBe(0);
  });
});
