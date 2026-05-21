import { getTableColumns } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { exercises } from "../exercises";

describe("exercises schema", () => {
  it("declares required columns", () => {
    expect(Object.keys(getTableColumns(exercises))).toEqual(
      expect.arrayContaining([
        "id",
        "tenantId",
        "memberId",
        "slug",
        "name",
        "primaryMuscle",
        "equipment",
        "metric",
        "defaultRestSec",
        "instructions",
        "imageUrl",
        "createdAt",
        "updatedAt",
        "deletedAt",
      ]),
    );
  });
});
