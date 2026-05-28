import { describe, it, expect, vi } from "vitest";

// Mock dependencies of tenant-store (which is imported by theme-provider)
vi.mock("@react-native-async-storage/async-storage", () => ({
  default: {
    getItem: vi.fn(async () => null),
    setItem: vi.fn(async () => undefined),
    removeMany: vi.fn(async () => undefined),
  },
}));

vi.mock("../supabase", () => ({
  getSupabase: () => null,
}));

import { hexAlpha, sanitizeHex } from "../theme-provider";

describe("sanitizeHex", () => {
  it("accepts 6-digit lowercase hex", () => {
    expect(sanitizeHex("#2f5596")).toBe("#2f5596");
  });
  it("accepts 6-digit uppercase hex", () => {
    expect(sanitizeHex("#2F5596")).toBe("#2F5596");
  });
  it("rejects 3-digit hex", () => {
    expect(sanitizeHex("#2f5")).toBeNull();
  });
  it("rejects missing #", () => {
    expect(sanitizeHex("2f5596")).toBeNull();
  });
  it("rejects garbage", () => {
    expect(sanitizeHex("not a color")).toBeNull();
    expect(sanitizeHex(null)).toBeNull();
    expect(sanitizeHex(undefined)).toBeNull();
  });
});

describe("hexAlpha", () => {
  it("converts hex + alpha to rgba", () => {
    expect(hexAlpha("#2f5596", 0.12)).toBe("rgba(47,85,150,0.12)");
  });
  it("handles 0 alpha", () => {
    expect(hexAlpha("#000000", 0)).toBe("rgba(0,0,0,0)");
  });
  it("handles full alpha", () => {
    expect(hexAlpha("#ffffff", 1)).toBe("rgba(255,255,255,1)");
  });
});
