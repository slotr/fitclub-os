import { describe, expect, it } from "vitest";
import { signInSchema } from "../actions";

describe("signInSchema", () => {
  it("requires email + password", () => {
    expect(signInSchema.safeParse({}).success).toBe(false);
  });

  it("accepts a valid payload", () => {
    const r = signInSchema.safeParse({
      email: "admin@x.com",
      password: "password123",
    });
    expect(r.success).toBe(true);
  });
});
