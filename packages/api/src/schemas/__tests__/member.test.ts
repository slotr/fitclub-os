import { describe, expect, it } from "vitest";
import { createMemberInput } from "../member";

describe("createMemberInput", () => {
  it("accepts a valid payload", () => {
    const r = createMemberInput.safeParse({
      email: "x@y.com",
      fullName: "Jane Doe",
      phone: "+15551234567",
    });
    expect(r.success).toBe(true);
  });

  it("rejects invalid email", () => {
    const r = createMemberInput.safeParse({
      email: "not-an-email",
      fullName: "Jane Doe",
    });
    expect(r.success).toBe(false);
  });

  it("requires fullName non-empty", () => {
    const r = createMemberInput.safeParse({ email: "x@y.com", fullName: "" });
    expect(r.success).toBe(false);
  });
});
