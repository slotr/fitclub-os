import { describe, expect, it } from "vitest";
import { classInsertSchema } from "../class";

describe("classInsertSchema", () => {
  it("accepts a valid payload", () => {
    const r = classInsertSchema.safeParse({
      name: "Yoga Flow",
      category: "yoga",
      defaultDurationMin: 60,
      defaultCapacity: 12,
      room: "Studio A",
    });
    expect(r.success).toBe(true);
  });

  it("rejects unknown category", () => {
    const r = classInsertSchema.safeParse({
      name: "Aqua",
      category: "aqua",
      defaultDurationMin: 45,
      defaultCapacity: 10,
    });
    expect(r.success).toBe(false);
  });

  it("requires defaultDurationMin >= 1", () => {
    const r = classInsertSchema.safeParse({
      name: "Yoga",
      category: "yoga",
      defaultDurationMin: 0,
      defaultCapacity: 12,
    });
    expect(r.success).toBe(false);
  });
});
