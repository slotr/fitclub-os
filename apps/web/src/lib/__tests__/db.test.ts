import { describe, expect, it } from "vitest";
import { withTenantScope } from "../db";

describe("withTenantScope", () => {
  it("rejects when no tenant id", async () => {
    await expect(withTenantScope(null, async () => "x")).rejects.toThrow(
      /tenant/i,
    );
  });
});
