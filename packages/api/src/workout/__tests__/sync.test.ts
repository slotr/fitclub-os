import { describe, expect, it } from "vitest";
import { selectPending, nextSyncStatus } from "../sync";

describe("selectPending", () => {
  it("returns only pending, non-active rows", () => {
    const rows = [
      { id: "a", syncStatus: "pending", isActive: 0 },
      { id: "b", syncStatus: "synced", isActive: 0 },
      { id: "c", syncStatus: "failed", isActive: 0 },
      { id: "d", syncStatus: "pending", isActive: 1 },
    ];
    expect(selectPending(rows).map((r) => r.id)).toEqual(["a", "c"]);
  });
});

describe("nextSyncStatus", () => {
  it("is synced on success", () => {
    expect(nextSyncStatus(true)).toBe("synced");
  });
  it("is failed on error", () => {
    expect(nextSyncStatus(false)).toBe("failed");
  });
});
