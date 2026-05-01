import { describe, expect, it } from "vitest";
import { sessionInsertSchema } from "../session";

const uuid = "11111111-1111-1111-1111-111111111111";

describe("sessionInsertSchema", () => {
  it("accepts a valid payload", () => {
    const r = sessionInsertSchema.safeParse({
      classId: uuid,
      startsAt: "2026-05-01T18:00:00Z",
      endsAt: "2026-05-01T19:00:00Z",
      capacity: 12,
    });
    expect(r.success).toBe(true);
  });

  it("rejects when endsAt is before startsAt", () => {
    const r = sessionInsertSchema.safeParse({
      classId: uuid,
      startsAt: "2026-05-01T19:00:00Z",
      endsAt: "2026-05-01T18:00:00Z",
      capacity: 12,
    });
    expect(r.success).toBe(false);
  });

  it("rejects negative capacity", () => {
    const r = sessionInsertSchema.safeParse({
      classId: uuid,
      startsAt: "2026-05-01T18:00:00Z",
      endsAt: "2026-05-01T19:00:00Z",
      capacity: 0,
    });
    expect(r.success).toBe(false);
  });
});
