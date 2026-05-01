import Link from "next/link";
import { cn } from "@/lib/utils";

type Category = "yoga" | "cross" | "pilates" | "strength" | "cardio" | "pt";
type Block = {
  id: string;
  category: Category;
  name: string;
  startsAt: Date;
  endsAt: Date;
  instructor: string | null;
  capacity: number;
  booked: number;
  waitlist: number;
};

const HOURS = Array.from({ length: 16 }, (_, i) => 6 + i); // 06:00 → 21:00
const FIRST_HOUR = HOURS[0] ?? 6;
const HOUR_PX = 38;

const tone: Record<Category, string> = {
  yoga: "bg-cat-yoga text-[#92400e] border-[#fbbf24]",
  cross: "bg-cat-cross text-[#991b1b] border-[#f87171]",
  pilates: "bg-cat-pilates text-[#1e40af] border-[#60a5fa]",
  strength: "bg-cat-strength text-[#5b21b6] border-[#a78bfa]",
  cardio: "bg-cat-cardio text-[#065f46] border-[#34d399]",
  pt: "bg-cat-pt text-[#9f1239] border-[#f9a8d4]",
};

function startOfWeek(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = (d.getDay() + 6) % 7; // Mon = 0
  d.setDate(d.getDate() - day);
  return d;
}

export function CalendarGrid({
  weekStart,
  blocks,
}: {
  weekStart: Date;
  blocks: Block[];
}) {
  const start = startOfWeek(weekStart);
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <div className="overflow-hidden rounded-md bg-surface shadow-fc-1">
      <div className="grid grid-cols-[64px_repeat(7,1fr)] border-b border-[var(--border-color)]">
        <div className="border-r border-[var(--border-color)] bg-[#faf9f7] py-2"></div>
        {days.map((d) => {
          const isToday = d.getTime() === today.getTime();
          return (
            <div
              key={d.toISOString()}
              className={cn(
                "border-r border-[var(--border-color)] px-3 py-2 last:border-0",
                isToday && "bg-amber-soft",
              )}
            >
              <div className="text-[11px] font-semibold uppercase tracking-wider2 text-fg-muted">
                {d.toLocaleDateString("en-GB", { weekday: "short" })}
                {isToday && " · Today"}
              </div>
              <div className="mt-0.5 text-[18px] font-extrabold tnum">
                {d.getDate()}
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-[64px_repeat(7,1fr)]">
        <div className="border-r border-[var(--border-color)]">
          {HOURS.map((h) => (
            <div
              key={h}
              style={{ height: HOUR_PX }}
              className="flex items-start justify-end border-b border-[var(--border-faint)] px-2 pt-1 text-[11px] text-fg-muted tnum"
            >
              {String(h).padStart(2, "0")}:00
            </div>
          ))}
        </div>
        {days.map((day) => {
          const dayBlocks = blocks.filter((b) => {
            const bd = new Date(b.startsAt);
            bd.setHours(0, 0, 0, 0);
            return bd.getTime() === day.getTime();
          });
          const isToday = day.getTime() === today.getTime();
          return (
            <div
              key={day.toISOString()}
              className={cn(
                "relative border-r border-[var(--border-color)] last:border-0",
                isToday && "bg-amber-soft/20",
              )}
              style={{ height: HOURS.length * HOUR_PX }}
            >
              {HOURS.map((h, i) => (
                <div
                  key={h}
                  style={{ top: i * HOUR_PX, height: HOUR_PX }}
                  className="absolute inset-x-0 border-b border-[var(--border-faint)]"
                />
              ))}
              {dayBlocks.map((b) => {
                const start = new Date(b.startsAt);
                const end = new Date(b.endsAt);
                const startH =
                  start.getHours() + start.getMinutes() / 60 - FIRST_HOUR;
                const durH =
                  (end.getTime() - start.getTime()) / 1000 / 3600;
                const top = startH * HOUR_PX;
                const height = Math.max(24, durH * HOUR_PX - 2);
                const full = b.booked >= b.capacity;
                return (
                  <Link
                    key={b.id}
                    href={
                      `/admin/classes/${b.id}` as Parameters<
                        typeof Link
                      >[0]["href"]
                    }
                    style={{ top, height }}
                    className={cn(
                      "absolute left-1 right-1 overflow-hidden rounded-sm border-l-2 px-2 py-1 transition-shadow hover:shadow-fc-2",
                      tone[b.category],
                    )}
                  >
                    <div className="truncate text-[11px] font-bold leading-tight">
                      {b.name}
                    </div>
                    <div className="truncate text-[10px] opacity-75 tnum">
                      {start.toLocaleTimeString("en-GB", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                      {b.instructor && ` · ${b.instructor}`}
                    </div>
                    {height > 36 && (
                      <div className="mt-0.5 text-[10px] font-semibold tnum">
                        {b.booked}/{b.capacity}
                        {b.waitlist > 0 && ` · ${b.waitlist} wait`}
                        {full && " ·"}
                      </div>
                    )}
                  </Link>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export const calendarLegend = [
  { label: "Yoga", className: "bg-cat-yoga" },
  { label: "CrossFit", className: "bg-cat-cross" },
  { label: "Pilates", className: "bg-cat-pilates" },
  { label: "Strength", className: "bg-cat-strength" },
  { label: "Cardio", className: "bg-cat-cardio" },
  { label: "PT", className: "bg-cat-pt" },
];
