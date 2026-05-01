import { describe, expect, it } from "vitest";
import { bookingInsertSchema, waitlistInsertSchema } from "../booking";

const uuid = "11111111-1111-1111-1111-111111111111";

describe("bookingInsertSchema", () => {
  it("accepts default status", () => {
    const r = bookingInsertSchema.parse({
      sessionId: uuid,
      memberId: uuid,
    });
    expect(r.status).toBe("booked");
  });

  it("rejects unknown status", () => {
    const r = bookingInsertSchema.safeParse({
      sessionId: uuid,
      memberId: uuid,
      status: "ghosted",
    });
    expect(r.success).toBe(false);
  });
});

describe("waitlistInsertSchema", () => {
  it("requires position >= 1", () => {
    const r = waitlistInsertSchema.safeParse({
      sessionId: uuid,
      memberId: uuid,
      position: 0,
    });
    expect(r.success).toBe(false);
  });
});
