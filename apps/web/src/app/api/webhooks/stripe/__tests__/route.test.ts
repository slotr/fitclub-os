import { describe, expect, it } from "vitest";
import { POST } from "../route";

describe("POST /api/webhooks/stripe", () => {
  it("rejects requests without a signature", async () => {
    const req = new Request("http://x/", { method: "POST", body: "{}" });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });
});
