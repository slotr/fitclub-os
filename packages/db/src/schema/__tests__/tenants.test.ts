import { describe, expect, it } from "vitest";
import { tenants } from "../tenants";

describe("tenants schema", () => {
  it("declares required columns", () => {
    const cols = Object.keys(tenants);
    expect(cols).toEqual(
      expect.arrayContaining([
        "id",
        "name",
        "slug",
        "brandColor",
        "logoUrl",
        "timezone",
        "locale",
        "createdAt",
      ]),
    );
  });

  it("uses uuid for id", () => {
    expect(tenants.id.dataType).toBe("string");
  });
});
