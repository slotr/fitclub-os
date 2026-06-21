import { describe, expect, it } from "vitest";
import { studioSettingsInsertSchema } from "../studioSettings";

describe("studioSettingsInsertSchema", () => {
  it("applies defaults when only name given", () => {
    const r = studioSettingsInsertSchema.parse({ name: "FitClub Beşiktaş" });
    expect(r.timezone).toBe("Europe/Istanbul");
    expect(r.locale).toBe("en");
    expect(r.currency).toBe("TRY");
    expect(r.hours).toEqual([]);
    expect(r.integrations).toEqual({});
  });

  it("rejects 4-letter currency", () => {
    const r = studioSettingsInsertSchema.safeParse({
      name: "FitClub",
      currency: "TURY",
    });
    expect(r.success).toBe(false);
  });

  it("rejects malformed hours", () => {
    const r = studioSettingsInsertSchema.safeParse({
      name: "FitClub",
      hours: [{ day: "Mon", open: "9am", close: "21:00" }],
    });
    expect(r.success).toBe(false);
  });
});
