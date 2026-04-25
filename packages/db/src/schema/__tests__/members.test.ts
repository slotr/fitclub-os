import { getTableColumns } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { members, memberStatusEnum } from "../members";

describe("members schema", () => {
  it("declares required columns", () => {
    const cols = Object.keys(getTableColumns(members));
    expect(cols).toEqual(
      expect.arrayContaining([
        "id",
        "tenantId",
        "authUserId",
        "email",
        "phone",
        "fullName",
        "birthdate",
        "gender",
        "photoUrl",
        "qrSecretEnc",
        "joinedAt",
        "status",
        "deletedAt",
      ]),
    );
  });

  it("exposes the status enum", () => {
    expect(memberStatusEnum.enumValues).toEqual(["active", "inactive", "pending"]);
  });
});
