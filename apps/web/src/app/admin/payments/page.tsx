import { desc, eq, gte, sql } from "drizzle-orm";
import { members, memberships, payments, plans } from "@fitness/db";
import { withTenantScope } from "@/lib/db";
import { getCurrentTenantId } from "@/lib/tenant";
import { KpiCard } from "@/components/admin/kpi-card";
import { Pill } from "@/components/admin/pill";
import { DataTable, Td, Th, TrRow } from "@/components/admin/data-table";
import { SearchIcon, MoreVerticalIcon, PlusIcon } from "@/components/admin/icons";
import { Seg } from "@/components/admin/seg";
import { retryPaymentAction, sendDunningAction } from "./_actions";

function fmtMoney(minor: number, currency: string) {
  const sign = currency === "TRY" ? "₺" : currency;
  return `${sign}${(minor / 100).toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
}

function fmtDay(d: Date) {
  return new Date(d).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
  });
}

export default async function PaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const sp = await searchParams;
  const filter = sp.filter ?? "all";

  const tenantId = await getCurrentTenantId();
  const startOf30 = new Date();
  startOf30.setDate(startOf30.getDate() - 30);
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const data = await withTenantScope(tenantId, async (db) => {
    const list = await db
      .select({
        id: payments.id,
        amount: payments.amountMinor,
        currency: payments.currency,
        status: payments.status,
        attemptCount: payments.attemptCount,
        stripeInvoiceId: payments.stripeInvoiceId,
        createdAt: payments.createdAt,
        memberName: members.fullName,
        memberId: members.id,
        planName: plans.name,
      })
      .from(payments)
      .innerJoin(members, eq(members.id, payments.memberId))
      .leftJoin(memberships, eq(memberships.memberId, members.id))
      .leftJoin(plans, eq(plans.id, memberships.planId))
      .orderBy(desc(payments.createdAt))
      .limit(60);
    const [mtdAgg] = await db
      .select({
        amount: sql<number>`coalesce(sum(${payments.amountMinor}),0)::int`,
      })
      .from(payments)
      .where(
        sql`${payments.status} = 'paid' and ${payments.createdAt} >= ${startOfMonth}`,
      );
    const [mrrAgg] = await db
      .select({
        amount: sql<number>`coalesce(sum(${plans.priceMinor}),0)::int`,
      })
      .from(memberships)
      .innerJoin(plans, eq(plans.id, memberships.planId))
      .where(eq(memberships.status, "active"));
    const [failedAgg] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(payments)
      .where(
        sql`${payments.status} = 'failed' and ${payments.createdAt} >= ${startOf30}`,
      );
    const [refundsAgg] = await db
      .select({
        amount: sql<number>`coalesce(sum(${payments.amountMinor}),0)::int`,
        count: sql<number>`count(*)::int`,
      })
      .from(payments)
      .where(
        sql`${payments.status} = 'refunded' and ${payments.createdAt} >= ${startOf30}`,
      );

    return {
      list,
      mtd: mtdAgg?.amount ?? 0,
      mrr: mrrAgg?.amount ?? 0,
      failedCount: failedAgg?.count ?? 0,
      refundsAmount: refundsAgg?.amount ?? 0,
      refundsCount: refundsAgg?.count ?? 0,
    };
  });

  const filtered =
    filter === "all"
      ? data.list
      : data.list.filter((r) => r.status === filter);

  const counts = {
    all: data.list.length,
    paid: data.list.filter((r) => r.status === "paid").length,
    failed: data.list.filter((r) => r.status === "failed").length,
    refunded: data.list.filter((r) => r.status === "refunded").length,
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-[22px] font-extrabold tracking-tighter">
          Payments
        </h1>
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider2 text-fg-muted">
            <span className="h-1.5 w-1.5 rounded-full bg-good" />
            Stripe webhook · live
          </span>
          <button className="inline-flex h-9 items-center gap-1.5 rounded-sm bg-fg px-3.5 text-[13px] font-semibold text-surface hover:opacity-90">
            <PlusIcon className="h-3.5 w-3.5" />
            New charge
          </button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3">
        <KpiCard
          label="MRR"
          value={fmtMoney(data.mrr, "TRY")}
          delta="↑ 4.2% vs last month"
          deltaTone="up"
        />
        <KpiCard
          label="MTD revenue"
          value={fmtMoney(data.mtd, "TRY")}
          delta="↑ 12.1% vs last month"
          deltaTone="up"
        />
        <KpiCard
          label="Failed · last 30d"
          value={data.failedCount.toLocaleString("en-US")}
          delta={data.failedCount > 0 ? "Needs retry" : "All clear"}
          deltaTone={data.failedCount > 0 ? "down" : "up"}
        />
        <KpiCard
          label="Refunds · last 30d"
          value={fmtMoney(data.refundsAmount, "TRY")}
          delta={`${data.refundsCount} refund${data.refundsCount === 1 ? "" : "s"}`}
        />
      </div>

      <nav className="flex border-b border-[var(--border-color)]">
        {[
          { value: "all", label: "All", count: counts.all },
          { value: "paid", label: "Paid", count: counts.paid },
          { value: "failed", label: "Failed", count: counts.failed },
          { value: "refunded", label: "Refunded", count: counts.refunded },
        ].map((t) => (
          <a
            key={t.value}
            href={`/admin/payments?filter=${t.value}`}
            className={`-mb-px border-b-2 px-3.5 py-2.5 text-[13px] font-semibold ${
              filter === t.value
                ? "border-fg text-fg"
                : "border-transparent text-fg-muted hover:text-fg"
            }`}
          >
            {t.label}{" "}
            <span className="ml-1 text-[11px] text-fg-faint tnum">
              {t.count}
            </span>
          </a>
        ))}
      </nav>

      <div className="flex items-center gap-2.5 rounded-md bg-surface p-3 shadow-fc-1">
        <FilterChip>Last 30 days ▾</FilterChip>
        <label className="flex h-9 max-w-72 flex-1 items-center gap-2 rounded-sm bg-bg px-3 text-[12px] text-fg-muted">
          <SearchIcon className="h-3.5 w-3.5" />
          <input
            placeholder="Search by member, invoice, charge…"
            className="flex-1 bg-transparent outline-none placeholder:text-fg-muted"
          />
        </label>
        <FilterChip>Plan: All ▾</FilterChip>
        <FilterChip>Status: All ▾</FilterChip>
        <button className="ml-auto h-8 rounded-sm border border-[var(--border-color)] bg-surface px-3 text-xs font-semibold hover:bg-[#faf9f7]">
          Export CSV
        </button>
      </div>

      <DataTable>
        <thead>
          <tr>
            <Th className="w-24">Date</Th>
            <Th>Member</Th>
            <Th>Plan</Th>
            <Th className="w-24 text-right">Amount</Th>
            <Th className="w-28">Status</Th>
            <Th className="w-28">Stripe</Th>
            <Th className="w-24">Attempt</Th>
            <Th className="w-56 text-right">Actions</Th>
          </tr>
        </thead>
        <tbody>
          {filtered.length === 0 && (
            <TrRow>
              <Td colSpan={8} className="py-12 text-center text-fg-muted">
                No payments match this filter.
              </Td>
            </TrRow>
          )}
          {filtered.map((r) => (
            <TrRow key={r.id} failed={r.status === "failed"}>
              <Td className="tnum">{fmtDay(r.createdAt)}</Td>
              <Td>{r.memberName}</Td>
              <Td>{r.planName ?? "—"}</Td>
              <Td className="text-right font-semibold tnum">
                {fmtMoney(r.amount, r.currency)}
              </Td>
              <Td>
                <Pill
                  variant={
                    r.status === "paid"
                      ? "good"
                      : r.status === "failed"
                        ? "bad"
                        : "info"
                  }
                >
                  {r.status === "paid"
                    ? "Paid"
                    : r.status === "failed"
                      ? "Failed"
                      : "Refunded"}
                </Pill>
              </Td>
              <Td>
                {r.stripeInvoiceId ? (
                  <a className="font-mono text-[12px] text-info hover:underline">
                    {r.stripeInvoiceId.slice(0, 11)}
                  </a>
                ) : (
                  <span className="text-fg-faint">—</span>
                )}
              </Td>
              <Td className="tnum">
                {r.status === "failed"
                  ? `attempt ${r.attemptCount}`
                  : <span className="text-fg-faint">—</span>}
              </Td>
              <Td className="text-right">
                {r.status === "failed" ? (
                  <RetryActions paymentId={r.id} />
                ) : (
                  <button className="text-fg-faint hover:text-fg">
                    <MoreVerticalIcon className="inline h-4 w-4" />
                  </button>
                )}
              </Td>
            </TrRow>
          ))}
        </tbody>
      </DataTable>

      <div className="flex items-center justify-between text-xs text-fg-muted">
        <span>
          Showing 1–{filtered.length} of {data.list.length} payments
        </span>
        <Seg options={["1", "2", "3", "…"] as const} value="1" size="sm" />
      </div>
    </div>
  );
}

function FilterChip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex h-9 items-center gap-1.5 rounded-sm bg-bg px-3 text-xs font-medium text-fg cursor-pointer">
      {children}
    </span>
  );
}

function RetryActions({ paymentId }: { paymentId: string }) {
  return (
    <div className="flex items-center justify-end gap-1.5">
      <form
        action={async () => {
          "use server";
          await retryPaymentAction(paymentId);
        }}
      >
        <button className="rounded-sm bg-fg px-2.5 py-1 text-[11px] font-semibold text-surface hover:opacity-90">
          Retry
        </button>
      </form>
      <form
        action={async () => {
          "use server";
          await sendDunningAction(paymentId);
        }}
      >
        <button className="rounded-sm border border-warn-soft bg-surface px-2.5 py-1 text-[11px] font-semibold text-warn hover:bg-warn-soft/30">
          Send dunning
        </button>
      </form>
    </div>
  );
}
