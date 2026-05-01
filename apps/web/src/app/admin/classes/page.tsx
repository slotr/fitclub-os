import Link from "next/link";
import { and, eq, gte, lt, sql } from "drizzle-orm";
import {
  bookings,
  classes,
  instructors,
  sessions,
  waitlist,
} from "@fitness/db";
import { withTenantScope } from "@/lib/db";
import { getCurrentTenantId } from "@/lib/tenant";
import { Seg } from "@/components/admin/seg";
import { CalendarGrid, calendarLegend } from "@/components/admin/calendar-grid";
import { PlusIcon } from "@/components/admin/icons";

function startOfWeek(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - day);
  return d;
}

export default async function ClassesPage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string }>;
}) {
  const sp = await searchParams;
  const today = sp.week ? new Date(sp.week) : new Date();
  const weekStart = startOfWeek(today);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 7);

  const tenantId = await getCurrentTenantId();
  const rows = await withTenantScope(tenantId, async (db) =>
    db
      .select({
        id: sessions.id,
        startsAt: sessions.startsAt,
        endsAt: sessions.endsAt,
        capacity: sessions.capacity,
        category: classes.category,
        name: classes.name,
        instructor: instructors.name,
        booked: sql<number>`(select count(*)::int from ${bookings} b where b.session_id = ${sessions.id} and b.status in ('booked','attended'))`,
        waitlistCount: sql<number>`(select count(*)::int from ${waitlist} w where w.session_id = ${sessions.id})`,
      })
      .from(sessions)
      .innerJoin(classes, eq(classes.id, sessions.classId))
      .leftJoin(instructors, eq(instructors.id, sessions.instructorId))
      .where(
        and(gte(sessions.startsAt, weekStart), lt(sessions.startsAt, weekEnd)),
      )
      .orderBy(sessions.startsAt),
  );

  const blocks = rows.map((r) => ({
    id: r.id,
    category: r.category,
    name: r.name,
    startsAt: new Date(r.startsAt),
    endsAt: new Date(r.endsAt),
    instructor: r.instructor,
    capacity: r.capacity,
    booked: r.booked,
    waitlist: r.waitlistCount,
  }));

  const weekLabel = `${weekStart.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
  })} – ${new Date(weekEnd.getTime() - 86400000).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })}`;

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-[22px] font-extrabold tracking-tighter">
            Classes schedule
          </h1>
          <p className="mt-1 text-[12px] text-fg-muted tnum">
            Week of {weekLabel} · {rows.length.toLocaleString("en-US")}{" "}
            sessions
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Seg options={["Day", "Week", "Month"] as const} value="Week" />
          <Link
            href={"/admin/classes/new" as Parameters<typeof Link>[0]["href"]}
            className="inline-flex h-9 items-center gap-1.5 rounded-sm bg-fg px-3.5 text-[13px] font-semibold text-surface hover:opacity-90"
          >
            <PlusIcon className="h-3.5 w-3.5" />
            New session
          </Link>
        </div>
      </div>

      <CalendarGrid weekStart={weekStart} blocks={blocks} />

      <div className="flex flex-wrap items-center gap-3 text-[12px] text-fg-muted">
        {calendarLegend.map((l) => (
          <span key={l.label} className="inline-flex items-center gap-1.5">
            <span
              className={`inline-block h-2.5 w-2.5 rounded-sm ${l.className}`}
            />
            {l.label}
          </span>
        ))}
      </div>
    </div>
  );
}
