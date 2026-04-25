import { describe, expect, it } from "vitest";
import { parseCreateMember } from "../_parse";

describe("parseCreateMember", () => {
  it("returns parsed data", () => {
    const fd = new FormData();
    fd.set("email", "x@y.com");
    fd.set("fullName", "Jane");
    const res = parseCreateMember(fd);
    expect(res.success).toBe(true);
  });

  it("rejects bad email", () => {
    const fd = new FormData();
    fd.set("email", "bad");
    fd.set("fullName", "Jane");
    expect(parseCreateMember(fd).success).toBe(false);
  });
});
