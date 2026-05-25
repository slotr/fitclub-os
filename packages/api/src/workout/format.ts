export function formatVolumeShort(kg: number): string {
  const n = Math.max(0, kg);
  if (n < 1000) return `${Math.round(n)}`;
  if (n < 10000) {
    const v = Math.round(n / 100) / 10;
    return `${v}k`;
  }
  if (n < 1_000_000) return `${Math.round(n / 1000)}k`;
  const m = Math.round(n / 100_000) / 10;
  return `${m}M`;
}

export function formatDuration(sec: number): string {
  const s = Math.max(0, Math.round(sec));
  if (s < 60) return `0:${s.toString().padStart(2, "0")}`;
  if (s < 3600) {
    const m = Math.floor(s / 60);
    const r = s % 60;
    return `${m}:${r.toString().padStart(2, "0")}`;
  }
  const h = Math.floor(s / 3600);
  const m = Math.round((s - h * 3600) / 60);
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

const SHORT_WEEKDAY = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const SHORT_MONTH = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

export function formatRelativeDate(iso: string): string {
  const then = new Date(iso);
  const now = new Date();
  const startOfDay = (d: Date) =>
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
  const days = Math.round(
    (startOfDay(now) - startOfDay(then)) / (24 * 60 * 60 * 1000),
  );
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  const wd = SHORT_WEEKDAY[then.getUTCDay()]!;
  const day = then.getUTCDate();
  const mo = SHORT_MONTH[then.getUTCMonth()]!;
  return `${wd} ${day} ${mo}`;
}

export type RangeKey = "1m" | "3m" | "6m" | "all";

const RANGE_DAYS: Record<Exclude<RangeKey, "all">, number> = {
  "1m": 30,
  "3m": 90,
  "6m": 180,
};

export function filterByRange<T extends { date: string }>(
  series: T[],
  range: RangeKey,
  now: Date = new Date(),
): T[] {
  if (range === "all") return series;
  const since = now.getTime() - RANGE_DAYS[range] * 24 * 60 * 60 * 1000;
  return series.filter((p) => new Date(p.date).getTime() >= since);
}
