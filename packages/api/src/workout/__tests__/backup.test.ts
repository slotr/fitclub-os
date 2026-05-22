import { describe, expect, it } from "vitest";
import { buildBackup, parseBackup, mergeRows } from "../backup";

describe("buildBackup / parseBackup", () => {
  it("round-trips a backup payload", () => {
    const json = buildBackup({
      memberId: "m1",
      exercises: [{ id: "x1", updatedAt: "2026-01-01T00:00:00Z" }],
      memberPrefs: [],
      workouts: [{ id: "w1", updatedAt: "2026-01-02T00:00:00Z" }],
      sets: [{ id: "s1" }],
    });
    const parsed = parseBackup(json);
    expect(parsed.memberId).toBe("m1");
    expect(parsed.workouts).toHaveLength(1);
  });

  it("throws on invalid JSON", () => {
    expect(() => parseBackup("not json")).toThrow();
  });

  it("throws on an unknown version", () => {
    const bad = JSON.stringify({ version: 99, memberId: "m1" });
    expect(() => parseBackup(bad)).toThrow();
  });
});

describe("mergeRows", () => {
  it("inserts rows that do not exist locally", () => {
    const result = mergeRows(
      [{ id: "a", updatedAt: "2026-01-01T00:00:00Z" }],
      [{ id: "b", updatedAt: "2026-01-01T00:00:00Z" }],
    );
    expect(result.map((r) => r.id).sort()).toEqual(["a", "b"]);
  });

  it("keeps the newer row on id collision", () => {
    const result = mergeRows(
      [{ id: "a", updatedAt: "2026-01-01T00:00:00Z" }],
      [{ id: "a", updatedAt: "2026-06-01T00:00:00Z" }],
    );
    expect(result).toHaveLength(1);
    expect(result[0]?.updatedAt).toBe("2026-06-01T00:00:00Z");
  });
});
