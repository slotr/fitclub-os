import { getTableColumns } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { auditLogs } from "../auditLogs";

describe("auditLogs schema", () => {
  it("declares required columns", () => {
    expect(Object.keys(getTableColumns(auditLogs))).toEqual(
      expect.arrayContaining([
        "id",
        "tenantId",
        "actorId",
        "action",
        "targetType",
        "targetId",
        "ip",
        "userAgent",
        "payload",
        "createdAt",
      ]),
    );
  });
});
