import { desc, eq, gte, sql } from "drizzle-orm";
import { checkins, members, memberships, payments } from "@fitness/db";
import { withTenantScope } from "@/lib/db";
import { getCurrentTenantId } from "@/lib/tenant";
import { KpiCard } from "@/components/admin/kpi-card";
import { Pill } from "@/components/admin/pill";
import { Sparkline, SparkBars } from "@/components/admin/sparkline";
import { Heatmap } from "@/components/admin/heatmap";
import { AreaChart } from "@/components/admin/area-chart";
import { Seg } from "@/components/admin/seg";
import { ChevronRightIcon } from "@/components/admin/icons";
import { formatMoneyShort, getStudioCurrency } from "@/lib/money";

function formatDate() {
  const today = new Date();
  return today.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatTime(d: Date) {
  return d.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

const MOCK_MRR_SERIES = [
  410, 412, 415, 418, 420, 419, 422, 425, 428, 430, 432, 431, 433, 435, 437,
  436, 438, 440,
];
const MOCK_HEATMAP = Array.from({ length: 7 }, (_, r) =>
  Array.from({ length: 14 }, (_, c) => {
    const mPeak = Math.exp(-Math.pow(c - 1.5, 2) / 4) * 0.4;
    const ePeak = Math.exp(-Math.pow(c - 11, 2) / 6) * 1;
    const dayBoost = r >= 5 ? 0.85 : 1;
    const noise = ((r * 31 + c * 17) % 11) / 40;
    return Math.round((mPeak + ePeak + noise) * dayBoost * 100);
  }),
);
const MOCK_HOURS = [4, 6, 10, 14, 18, 20, 18, 15, 11, 8, 6, 4];

export default async function DashboardPage() {
  const tenantId = await getCurrentTenantId();
  const studioCurrency = await getStudioCurrency();

  const data = await withTenantScope(tenantId, async (db) => {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const startOf30 = new Date();
    startOf30.setDate(startOf30.getDate() - 30);

    const [activeMembers] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(members)
      .where(eq(members.status, "active"));
    const [todayCheckins] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(checkins)
      .where(gte(checkins.checkedInAt, startOfDay));
    const [mrrAgg] = await db
      .select({ amount: sql<number>`coalesce(sum(${payments.amountMinor}),0)::int` })
      .from(payments)
      .where(eq(payments.status, "paid"));
    const [pastDue] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(memberships)
      .where(eq(memberships.status, "past_due"));
    const liveFeed = await db
      .select({
        id: checkins.id,
        at: checkins.checkedInAt,
        member: members.fullName,
        gateId: checkins.gateId,
      })
      .from(checkins)
      .innerJoin(members, eq(members.id, checkins.memberId))
      .orderBy(desc(checkins.checkedInAt))
      .limit(6);

    return {
      activeMembers: activeMembers?.count ?? 0,
      todayCheckins: todayCheckins?.count ?? 0,
      mrr: mrrAgg?.amount ?? 0,
      pastDue: pastDue?.count ?? 0,
      liveFeed,
    };
  });

  const todaysClasses = [
    {
      time: "17:00",
      name: "Pilates Reformer",
      meta: "Selin · 60min · Studio B",
      booked: 6,
      cap: 8,
      tone: "good" as const,
    },
    {
      time: "18:00",
      name: "Yoga Flow",
      meta: "Ayşe · 75min · Studio A",
      booked: 8,
      cap: 12,
      tone: "good" as const,
    },
    {
      time: "19:30",
      name: "CrossFit WOD",
      meta: "Mehmet · 60min · Open floor",
      booked: 12,
      cap: 12,
      wait: 3,
      tone: "warn" as const,
    },
    {
      time: "20:30",
      name: "Spin",
      meta: "Hakan · 45min · Spin room",
      booked: 4,
      cap: 8,
      tone: "good" as const,
    },
  ];

  const attention = [
    { variant: "bad" as const, label: "Failed pay", text: "7 awaiting retry" },
    { variant: "warn" as const, label: "At-risk", text: "14 churn-flagged" },
    { variant: "info" as const, label: "Waitlist", text: "3 promotions queued" },
    { variant: "outline" as const, label: "New leads", text: "9 today" },
    { variant: "good" as const, label: "Renewals", text: "22 next 7 days" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-[22px] font-extrabold tracking-tighter">
          Today · {formatDate()}
        </h1>
        <Seg
          options={["Today", "This week", "This month", "Last 30d"] as const}
          value="This week"
        />
      </div>

      <div className="grid grid-cols-4 gap-3">
        <KpiCard
          label="Active members"
          value={data.activeMembers.toLocaleString("en-US")}
          spark={<Sparkline values={MOCK_MRR_SERIES} stroke="var(--good)" />}
        />
        <KpiCard
          label="MRR"
          value={formatMoneyShort(data.mrr, studioCurrency)}
          spark={<Sparkline values={MOCK_MRR_SERIES} stroke="var(--good)" />}
        />
        <KpiCard
          label="Today check-ins"
          value={data.todayCheckins.toLocaleString("en-US")}
          spark={<SparkBars values={MOCK_HOURS} highlight={5} />}
        />
        <KpiCard
          label="Past-due"
          value={data.pastDue.toLocaleString("en-US")}
          delta={data.pastDue > 0 ? "needs attention" : "all clear"}
          deltaTone={data.pastDue > 0 ? "down" : "up"}
          spark={
            <Sparkline values={[2, 3, 2, 4, 3, 5, 4, 6, 7]} stroke="var(--bad)" />
          }
        />
      </div>

      <div className="grid grid-cols-[1fr_1.1fr] gap-3">
        <Card title="Live check-in feed" action="View all →">
          <div>
            {data.liveFeed.length === 0 && (
              <div className="py-6 text-center text-xs text-fg-muted">
                No check-ins today.
              </div>
            )}
            {data.liveFeed.map((row) => (
              <div
                key={row.id}
                className="grid grid-cols-[8px_1fr_auto_auto] items-center gap-2.5 border-b border-[var(--border-faint)] py-1.5 text-xs last:border-0"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-good" />
                <span className="font-semibold">{row.member}</span>
                <Pill variant="outline">
                  {row.gateId ?? "Main entrance"}
                </Pill>
                <span className="font-mono tnum text-fg-muted">
                  {formatTime(new Date(row.at))}
                </span>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Today's classes" action="Open schedule →">
          <div>
            {todaysClasses.map((c) => (
              <div
                key={c.time}
                className="grid grid-cols-[56px_1fr_auto_auto] items-center gap-2.5 border-b border-[var(--border-faint)] py-2 text-xs last:border-0"
              >
                <div className="font-bold tnum text-[13px]">{c.time}</div>
                <div>
                  <div className="font-semibold">{c.name}</div>
                  <div className="text-[11px] text-fg-muted">{c.meta}</div>
                </div>
                <div className="inline-flex gap-0.5">
                  {Array.from({ length: c.cap }).map((_, i) => (
                    <span
                      key={i}
                      className={`block h-1.5 w-1.5 rounded-full ${i < c.booked ? "bg-fg" : "bg-[#e5e3e0]"}`}
                    />
                  ))}
                </div>
                <Pill variant={c.tone}>
                  {c.booked}/{c.cap}
                  {c.wait ? ` · ${c.wait} wait` : ""}
                </Pill>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-[1.4fr_1fr_1fr] gap-3">
        <Card title="MRR — last 90 days">
          <AreaChart values={MOCK_MRR_SERIES} />
        </Card>
        <Card title="Attendance heatmap">
          <Heatmap values={MOCK_HEATMAP} />
        </Card>
        <Card title="What needs attention">
          <div>
            {attention.map((a, i) => (
              <div
                key={i}
                className="flex items-center justify-between border-b border-[var(--border-faint)] py-2 text-xs last:border-0"
              >
                <div className="flex items-center gap-2.5">
                  <Pill variant={a.variant}>{a.label}</Pill>
                  <span>{a.text}</span>
                </div>
                <ChevronRightIcon className="h-3.5 w-3.5 text-fg-muted" />
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

function Card({
  title,
  action,
  children,
}: {
  title: string;
  action?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-md bg-surface px-4 py-4 shadow-fc-1">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-[13px] font-bold">{title}</h3>
        {action && (
          <span className="text-xs text-fg-muted hover:text-fg cursor-pointer">
            {action}
          </span>
        )}
      </div>
      {children}
    </div>
  );
}
