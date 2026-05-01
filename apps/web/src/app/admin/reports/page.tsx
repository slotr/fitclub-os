import { desc, eq, gte, sql } from "drizzle-orm";
import {
  bookings,
  checkins,
  classes,
  instructors,
  members,
  payments,
  sessions,
} from "@fitness/db";
import { withTenantScope } from "@/lib/db";
import { getCurrentTenantId } from "@/lib/tenant";
import { KpiCard } from "@/components/admin/kpi-card";
import { AreaChart } from "@/components/admin/area-chart";
import { Sparkline } from "@/components/admin/sparkline";
import { Seg } from "@/components/admin/seg";
import { DataTable, Td, Th, TrRow } from "@/components/admin/data-table";

function fmtMoney(minor: number, currency = "TRY") {
  const sign = currency === "TRY" ? "₺" : currency;
  if (minor / 100 >= 1000) return `${sign}${(minor / 100 / 1000).toFixed(1)}k`;
  return `${sign}${(minor / 100).toFixed(0)}`;
}

const MOCK_MRR = [
  300, 305, 312, 318, 322, 328, 335, 340, 348, 355, 362, 368, 375, 380, 388,
  395, 402, 410, 415, 420, 428, 432, 438, 440,
];

const COHORTS = [
  { label: "Jan 2026", initial: 42, weeks: [100, 92, 86, 81, 78, 76] },
  { label: "Dec 2025", initial: 38, weeks: [100, 95, 84, 79, 75, 71, 68] },
  { label: "Nov 2025", initial: 44, weeks: [100, 89, 80, 73, 68, 64, 61] },
  { label: "Oct 2025", initial: 39, weeks: [100, 88, 76, 70, 65, 60, 57, 54] },
];

export default async function ReportsPage() {
  const tenantId = await getCurrentTenantId();
  const start30 = new Date();
  start30.setDate(start30.getDate() - 30);

  const data = await withTenantScope(tenantId, async (db) => {
    const [activeCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(members)
      .where(eq(members.status, "active"));
    const [revenueAgg] = await db
      .select({
        amount: sql<number>`coalesce(sum(${payments.amountMinor}),0)::int`,
      })
      .from(payments)
      .where(
        sql`${payments.status} = 'paid' and ${payments.createdAt} >= ${start30}`,
      );
    const [checkinAgg] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(checkins)
      .where(gte(checkins.checkedInAt, start30));
    const [bookingAgg] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(bookings)
      .where(gte(bookings.bookedAt, start30));

    const topClasses = await db
      .select({
        id: classes.id,
        name: classes.name,
        category: classes.category,
        sessionCount: sql<number>`count(distinct ${sessions.id})::int`,
        bookingCount: sql<number>`count(${bookings.id})::int`,
      })
      .from(classes)
      .leftJoin(sessions, eq(sessions.classId, classes.id))
      .leftJoin(bookings, eq(bookings.sessionId, sessions.id))
      .groupBy(classes.id, classes.name, classes.category)
      .orderBy(desc(sql<number>`count(${bookings.id})::int`))
      .limit(6);

    const topInstructors = await db
      .select({
        id: instructors.id,
        name: instructors.name,
        sessionCount: sql<number>`count(distinct ${sessions.id})::int`,
        bookingCount: sql<number>`count(${bookings.id})::int`,
      })
      .from(instructors)
      .leftJoin(sessions, eq(sessions.instructorId, instructors.id))
      .leftJoin(bookings, eq(bookings.sessionId, sessions.id))
      .groupBy(instructors.id, instructors.name)
      .orderBy(desc(sql<number>`count(${bookings.id})::int`))
      .limit(6);

    return {
      activeCount: activeCount?.count ?? 0,
      revenue30: revenueAgg?.amount ?? 0,
      checkins30: checkinAgg?.count ?? 0,
      bookings30: bookingAgg?.count ?? 0,
      topClasses,
      topInstructors,
    };
  });

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-[22px] font-extrabold tracking-tighter">
            Reports
          </h1>
          <p className="mt-1 text-[12px] text-fg-muted">
            Last 30 days · all locations · TRY
          </p>
        </div>
        <Seg
          options={["Last 7d", "Last 30d", "Last 90d", "YTD"] as const}
          value="Last 30d"
        />
      </div>

      <div className="grid grid-cols-4 gap-3">
        <KpiCard
          label="Active members"
          value={data.activeCount.toLocaleString("en-US")}
          delta="↑ 12 vs prior 30d"
          deltaTone="up"
          spark={<Sparkline values={MOCK_MRR.slice(8)} stroke="var(--good)" />}
        />
        <KpiCard
          label="Revenue · 30d"
          value={fmtMoney(data.revenue30)}
          delta="↑ 8.4% vs prior 30d"
          deltaTone="up"
          spark={<Sparkline values={MOCK_MRR} stroke="var(--good)" />}
        />
        <KpiCard
          label="Check-ins"
          value={data.checkins30.toLocaleString("en-US")}
          delta="peak 18:00"
          deltaTone="flat"
        />
        <KpiCard
          label="Class bookings"
          value={data.bookings30.toLocaleString("en-US")}
          delta="↑ 6.1%"
          deltaTone="up"
        />
      </div>

      <div className="grid grid-cols-[2fr_1fr] gap-3">
        <Card title="MRR — last 12 weeks">
          <AreaChart values={MOCK_MRR} />
        </Card>
        <Card title="Cohort retention">
          <table className="w-full text-[11px]">
            <thead>
              <tr className="text-fg-muted">
                <th className="py-1 text-left font-semibold">Cohort</th>
                <th className="py-1 text-right font-semibold">Size</th>
                <th className="py-1 text-right font-semibold">W4</th>
                <th className="py-1 text-right font-semibold">W8</th>
                <th className="py-1 text-right font-semibold">W12</th>
              </tr>
            </thead>
            <tbody>
              {COHORTS.map((c) => (
                <tr
                  key={c.label}
                  className="border-t border-[var(--border-faint)]"
                >
                  <td className="py-1.5 font-semibold">{c.label}</td>
                  <td className="py-1.5 text-right tnum">{c.initial}</td>
                  <td className="py-1.5 text-right tnum">{c.weeks[3]}%</td>
                  <td className="py-1.5 text-right tnum">{c.weeks[5] ?? "—"}{c.weeks[5] ? "%" : ""}</td>
                  <td className="py-1.5 text-right tnum">{c.weeks[7] ?? "—"}{c.weeks[7] ? "%" : ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Card title="Top classes">
          <DataTable className="shadow-none">
            <thead>
              <tr>
                <Th>Class</Th>
                <Th className="text-right">Sessions</Th>
                <Th className="text-right">Bookings</Th>
              </tr>
            </thead>
            <tbody>
              {data.topClasses.map((r) => (
                <TrRow key={r.id}>
                  <Td>{r.name}</Td>
                  <Td className="text-right tnum">{r.sessionCount}</Td>
                  <Td className="text-right tnum">{r.bookingCount}</Td>
                </TrRow>
              ))}
            </tbody>
          </DataTable>
        </Card>
        <Card title="Instructor utilization">
          <DataTable className="shadow-none">
            <thead>
              <tr>
                <Th>Instructor</Th>
                <Th className="text-right">Sessions</Th>
                <Th className="text-right">Bookings</Th>
              </tr>
            </thead>
            <tbody>
              {data.topInstructors.map((r) => (
                <TrRow key={r.id}>
                  <Td>{r.name}</Td>
                  <Td className="text-right tnum">{r.sessionCount}</Td>
                  <Td className="text-right tnum">{r.bookingCount}</Td>
                </TrRow>
              ))}
            </tbody>
          </DataTable>
        </Card>
      </div>
    </div>
  );
}

function Card({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-md bg-surface p-4 shadow-fc-1">
      <h3 className="mb-3 text-[13px] font-bold">{title}</h3>
      {children}
    </div>
  );
}
