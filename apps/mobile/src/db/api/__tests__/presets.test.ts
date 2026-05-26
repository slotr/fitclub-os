import { describe, it, expect, vi } from "vitest";

// Mock db client to bypass expo-sqlite
vi.mock("../../client", () => {
  const makeChain = () => {
    const chain: Record<string, unknown> = {};
    const methods = ["select", "from", "where", "insert", "values", "update", "set", "delete", "all", "run", "sort", "find"];
    for (const m of methods) {
      chain[m] = () => chain;
    }
    (chain as { all: () => unknown[] }).all = () => [];
    (chain as { run: () => void }).run = () => undefined;
    return chain;
  };
  return {
    db: {
      select: () => makeChain(),
      insert: () => makeChain(),
      update: () => makeChain(),
      delete: () => makeChain(),
    },
  };
});

import { PresetExercisesMissingError, lookupPresetBySlug } from "../presets";

describe("presets api", () => {
  it("PresetExercisesMissingError carries missing slugs", () => {
    const e = new PresetExercisesMissingError(["a", "b"]);
    expect(e.missing).toEqual(["a", "b"]);
    expect(e.name).toBe("PresetExercisesMissingError");
  });
  it("lookupPresetBySlug returns a known preset", () => {
    const p = lookupPresetBySlug("stronglifts-5x5");
    expect(p?.name).toBe("StrongLifts 5×5");
  });
  it("lookupPresetBySlug returns undefined for unknown", () => {
    expect(lookupPresetBySlug("does-not-exist")).toBeUndefined();
  });
});
