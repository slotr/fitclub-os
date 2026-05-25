import { describe, expect, it, vi } from "vitest";
import {
  filterByRange, formatDuration, formatRelativeDate, formatVolumeShort,
} from "../format";

describe("formatVolumeShort", () => {
  it("returns the raw integer under 1000", () => {
    expect(formatVolumeShort(950)).toBe("950");
    expect(formatVolumeShort(0)).toBe("0");
  });
  it("uses k for thousands", () => {
    expect(formatVolumeShort(186430)).toBe("186k");
  });
  it("uses one decimal for tens of thousands rounding", () => {
    expect(formatVolumeShort(1500)).toBe("1.5k");
    expect(formatVolumeShort(1500000)).toBe("1.5M");
  });
});

describe("formatDuration", () => {
  it("formats seconds for under a minute", () => {
    expect(formatDuration(45)).toBe("0:45");
  });
  it("formats m:ss for under an hour", () => {
    expect(formatDuration(125)).toBe("2:05");
  });
  it("formats hours for an hour or more", () => {
    expect(formatDuration(3600)).toBe("1h");
    expect(formatDuration(5400)).toBe("1h 30m");
    expect(formatDuration(84600)).toBe("23h 30m");
  });
});

describe("formatRelativeDate", () => {
  it("returns Today for today's ISO", () => {
    const now = new Date("2026-05-25T12:00:00Z");
    vi.useFakeTimers();
    vi.setSystemTime(now);
    expect(formatRelativeDate("2026-05-25T08:00:00Z")).toBe("Today");
    vi.useRealTimers();
  });
  it("returns Yesterday for one day ago", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-25T12:00:00Z"));
    expect(formatRelativeDate("2026-05-24T08:00:00Z")).toBe("Yesterday");
    vi.useRealTimers();
  });
  it("returns N days ago for under a week", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-25T12:00:00Z"));
    expect(formatRelativeDate("2026-05-22T08:00:00Z")).toBe("3 days ago");
    vi.useRealTimers();
  });
  it("returns short weekday + date for older entries", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-25T12:00:00Z"));
    const out = formatRelativeDate("2026-05-17T08:00:00Z");
    expect(out).toMatch(/^\w{3} 17 May$/);
    vi.useRealTimers();
  });
});

describe("filterByRange", () => {
  it("trims series to last N days", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-25T12:00:00Z"));
    const series = [
      { date: "2026-01-01", value: 1 },
      { date: "2026-04-01", value: 2 },
      { date: "2026-05-20", value: 3 },
    ];
    expect(filterByRange(series, "1m").map((p) => p.value)).toEqual([3]);
    expect(filterByRange(series, "3m").map((p) => p.value)).toEqual([2, 3]);
    expect(filterByRange(series, "all")).toHaveLength(3);
    vi.useRealTimers();
  });
});
