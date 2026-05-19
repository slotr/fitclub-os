import { describe, expect, it } from "vitest";
import {
  notificationTemplateInsertSchema,
  notificationTemplateUpdateSchema,
} from "../notification";

describe("notificationTemplateInsertSchema", () => {
  it("accepts a push template without subject", () => {
    const r = notificationTemplateInsertSchema.safeParse({
      key: "class_reminder",
      channel: "push",
      body: "Your class starts in 90 minutes.",
      variables: ["firstName"],
    });
    expect(r.success).toBe(true);
  });

  it("rejects unknown channel", () => {
    const r = notificationTemplateInsertSchema.safeParse({
      key: "welcome",
      channel: "telegram",
      body: "hi",
    });
    expect(r.success).toBe(false);
  });

  it("update schema accepts partial body", () => {
    const r = notificationTemplateUpdateSchema.safeParse({
      enabled: false,
    });
    expect(r.success).toBe(true);
  });
});
