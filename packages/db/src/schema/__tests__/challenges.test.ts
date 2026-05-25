import { getTableColumns } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { challenges } from "../challenges";

describe("challenges schema", () => {
  it("declares required columns", () => {
    expect(Object.keys(getTableColumns(challenges))).toEqual(
      expect.arrayContaining([
        "id",
        "tenantId",
        "name",
        "description",
        "metricType",
        "exerciseId",
        "startsAt",
        "endsAt",
        "status",
        "createdBy",
        "createdAt",
        "updatedAt",
        "deletedAt",
      ]),
    );
  });
});
