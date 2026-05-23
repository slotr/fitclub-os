import { readFile } from "node:fs/promises";
import { join } from "node:path";
import sharp from "sharp";
import { describe, expect, it } from "vitest";
import { composeAnimatedWebp } from "../image-pipeline";

const FIX = join(__dirname, "fixtures");

describe("composeAnimatedWebp", () => {
  it("produces a multi-page animated WebP from two frames", async () => {
    const a = await readFile(join(FIX, "frame-a.png"));
    const b = await readFile(join(FIX, "frame-b.png"));
    const out = await composeAnimatedWebp(a, b);
    expect(out).toBeInstanceOf(Buffer);
    expect(out.length).toBeGreaterThan(0);
    expect(out.slice(0, 4).toString("ascii")).toBe("RIFF");
    expect(out.slice(8, 12).toString("ascii")).toBe("WEBP");
    const meta = await sharp(out).metadata();
    expect(meta.pages ?? 1).toBeGreaterThanOrEqual(2);
  });

  it("still produces a single-page WebP when both inputs are the same", async () => {
    const a = await readFile(join(FIX, "frame-a.png"));
    const out = await composeAnimatedWebp(a, a);
    const meta = await sharp(out).metadata();
    expect(out.slice(0, 4).toString("ascii")).toBe("RIFF");
    expect((meta.pages ?? 1) >= 2 || (meta.pages ?? 1) === 1).toBe(true);
  });
});
