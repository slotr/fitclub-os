import Link from "next/link";
import { notFound } from "next/navigation";
import { and, desc, eq, sql } from "drizzle-orm";
import {
  checkins,
  members,
  memberships,
  payments,
  plans,
} from "@fitness/db";
import { withTenantScope } from "@/lib/db";
import { getCurrentTenantId } from "@/lib/tenant";
import { Pill } from "@/components/admin/pill";
import { Avatar } from "@/components/admin/avatar";

type Params = { id: string };

function fmtDate(d: Date | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
function fmtTime(d: Date) {
  return new Date(d).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });
}
function fmtMoney(minor: number, currency: string) {
  const sign = currency === "TRY" ? "₺" : currency;
  return `${sign}${(minor / 100).toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

export default async function MemberDetailPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { id } = await params;
  const tenantId = await getCurrentTenantId();

  const data = await withTenantScope(tenantId, async (db) => {
    const [m] = await db
      .select()
      .from(members)
      .where(eq(members.id, id))
      .limit(1);
    if (!m) return null;
    const [ms] = await db
      .select({
        id: memberships.id,
        status: memberships.status,
        startedAt: memberships.startedAt,
        endsAt: memberships.endsAt,
        autoRenew: memberships.autoRenew,
        plan: plans.name,
        priceMinor: plans.priceMinor,
        currency: plans.currency,
      })
      .from(memberships)
      .leftJoin(plans, eq(plans.id, memberships.planId))
      .where(eq(memberships.memberId, id))
      .orderBy(desc(memberships.createdAt))
      .limit(1);
    const recentCheckins = await db
      .select({
        id: checkins.id,
        at: checkins.checkedInAt,
        source: checkins.source,
        gateId: checkins.gateId,
      })
      .from(checkins)
      .where(eq(checkins.memberId, id))
      .orderBy(desc(checkins.checkedInAt))
      .limit(8);
    const recentPayments = await db
      .select({
        id: payments.id,
        amount: payments.amountMinor,
        currency: payments.currency,
        status: payments.status,
        createdAt: payments.createdAt,
      })
      .from(payments)
      .where(eq(payments.memberId, id))
      .orderBy(desc(payments.createdAt))
      .limit(6);
    const [stats] = await db
      .select({
        totalCheckins: sql<number>`count(*)::int`,
      })
      .from(checkins)
      .where(eq(checkins.memberId, id));
    const [paid] = await db
      .select({
        total: sql<number>`coalesce(sum(${payments.amountMinor}),0)::int`,
      })
      .from(payments)
      .where(
        and(eq(payments.memberId, id), eq(payments.status, "paid")),
      );
    return {
      member: m,
      membership: ms,
      checkins: recentCheckins,
      payments: recentPayments,
      totalCheckins: stats?.totalCheckins ?? 0,
      lifetimePaid: paid?.total ?? 0,
    };
  });

  if (!data) notFound();
  const m = data.member;
  const ms = data.membership;

  const churnRisk: { variant: "good" | "warn" | "bad"; label: string; reason: string } =
    ms?.status === "past_due"
      ? { variant: "bad", label: "High risk", reason: "Past-due 8 days" }
      : data.totalCheckins < 4
        ? {
            variant: "warn",
            label: "Medium risk",
            reason: "Few visits in last 30 days",
          }
        : { variant: "good", label: "Low risk", reason: "Healthy attendance" };

  type Event = {
    key: string;
    dot: "green" | "amber" | "blue" | "purple" | "gray";
    title: string;
    detail?: string;
    when: Date;
  };
  const events: Event[] = [
    ...data.checkins.map((c) => ({
      key: `c-${c.id}`,
      dot: "green" as const,
      title: "Check-in",
      detail: `${c.source.toUpperCase()} · ${c.gateId ?? "Main entrance"}`,
      when: new Date(c.at),
    })),
    ...data.payments.map((p) => ({
      key: `p-${p.id}`,
      dot:
        p.status === "paid"
          ? ("amber" as const)
          : p.status === "failed"
            ? ("gray" as const)
            : ("blue" as const),
      title:
        p.status === "paid"
          ? "Payment received"
          : p.status === "failed"
            ? "Payment failed"
            : "Refund issued",
      detail: fmtMoney(p.amount, p.currency),
      when: new Date(p.createdAt),
    })),
  ].sort((a, b) => b.when.getTime() - a.when.getTime());

  return (
    <div className="grid grid-cols-[320px_1fr_280px] gap-4">
      {/* LEFT */}
      <aside className="space-y-3">
        <div className="flex flex-col items-center rounded-md bg-surface p-6 shadow-fc-1">
          <Avatar name={m.fullName} size={80} className="mb-3" />
          <h2 className="text-[18px] font-extrabold tracking-tighter">
            {m.fullName}
          </h2>
          <Pill
            variant={
              m.status === "active"
                ? "good"
                : m.status === "pending"
                  ? "outline"
                  : "bad"
            }
          >
            {m.status === "active"
              ? "Active member"
              : m.status === "pending"
                ? "Pending"
                : "Inactive"}
          </Pill>

          <div className="mt-4 w-full border-t border-[var(--border-faint)] pt-3.5">
            <Fact label="Member ID" value={m.id.slice(0, 8)} />
            <Fact label="Email" value={m.email} />
            <Fact label="Phone" value={m.phone ?? "—"} />
            <Fact label="Joined" value={fmtDate(m.joinedAt)} />
            <Fact
              label="Birthdate"
              value={m.birthdate ? fmtDate(new Date(m.birthdate)) : "—"}
            />
          </div>

          <div className="mt-4 flex w-full flex-col gap-2">
            <button className="h-9 rounded-sm border border-[var(--border-color)] bg-surface text-xs font-semibold hover:bg-[#faf9f7]">
              Send message
            </button>
            <button className="h-9 rounded-sm border border-[var(--border-color)] bg-surface text-xs font-semibold hover:bg-[#faf9f7]">
              Pause membership
            </button>
            <button className="h-9 rounded-sm border border-[var(--border-color)] bg-surface text-xs font-semibold text-bad hover:bg-bad-soft/40">
              Cancel membership
            </button>
          </div>
        </div>
      </aside>

      {/* CENTER */}
      <section className="rounded-md bg-surface p-4 shadow-fc-1">
        <nav className="mb-4 flex border-b border-[var(--border-color)]">
          {[
            { label: "Activity", active: true },
            { label: "Memberships" },
            { label: "Payments" },
            { label: "Check-ins" },
            { label: "Notes" },
          ].map((t) => (
            <span
              key={t.label}
              className={`-mb-px cursor-pointer border-b-2 px-3.5 py-2.5 text-[13px] ${t.active ? "border-fg font-semibold text-fg" : "border-transparent font-medium text-fg-muted hover:text-fg"}`}
            >
              {t.label}
            </span>
          ))}
        </nav>
        <div>
          {events.length === 0 && (
            <p className="py-8 text-center text-sm text-fg-muted">
              No activity yet.
            </p>
          )}
          {events.slice(0, 12).map((e) => (
            <div
              key={e.key}
              className="grid grid-cols-[12px_1fr_auto] items-start gap-3 border-b border-[var(--border-faint)] py-2.5 last:border-0"
            >
              <span
                className="mt-1.5 h-2 w-2 rounded-full"
                style={{
                  background:
                    e.dot === "green"
                      ? "var(--good)"
                      : e.dot === "amber"
                        ? "var(--accent-amber)"
                        : e.dot === "blue"
                          ? "var(--info)"
                          : e.dot === "purple"
                            ? "#7c3aed"
                            : "var(--fg-faint)",
                }}
              />
              <div className="text-[13px]">
                <div className="font-semibold">{e.title}</div>
                {e.detail && (
                  <div className="mt-0.5 text-[12px] text-fg-muted">
                    {e.detail}
                  </div>
                )}
              </div>
              <span className="whitespace-nowrap text-[12px] text-fg-muted tnum">
                {fmtDate(e.when)} · {fmtTime(e.when)}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* RIGHT */}
      <aside className="space-y-3">
        <div className="rounded-md bg-surface p-4 shadow-fc-1">
          <h4 className="mb-2.5 text-[11px] font-semibold uppercase tracking-widest2 text-fg-muted">
            Membership
          </h4>
          {ms ? (
            <>
              <Stat label="Plan" value={ms.plan ?? "—"} />
              <Stat
                label="Price"
                value={
                  ms.priceMinor != null && ms.currency
                    ? fmtMoney(ms.priceMinor, ms.currency)
                    : "—"
                }
              />
              <Stat
                label="Status"
                value={ms.status.replace("_", " ")}
              />
              <Stat label="Started" value={fmtDate(ms.startedAt)} />
              <Stat label="Ends" value={fmtDate(ms.endsAt)} />
              <Stat label="Auto-renew" value={ms.autoRenew ? "Yes" : "No"} />
            </>
          ) : (
            <p className="text-xs text-fg-muted">No active membership.</p>
          )}
          <Link
            href={
              "/admin/plans" as Parameters<typeof Link>[0]["href"]
            }
            className="mt-3 inline-block text-[12px] font-medium text-fg underline underline-offset-2"
          >
            Change plan →
          </Link>
        </div>

        <div className="rounded-md bg-surface p-4 shadow-fc-1">
          <h4 className="mb-2.5 text-[11px] font-semibold uppercase tracking-widest2 text-fg-muted">
            Churn risk
          </h4>
          <div className="flex items-center gap-3 py-1.5">
            <span
              className="h-3.5 w-3.5 rounded-full"
              style={{
                background:
                  churnRisk.variant === "good"
                    ? "var(--good)"
                    : churnRisk.variant === "warn"
                      ? "var(--warn)"
                      : "var(--bad)",
                boxShadow: `0 0 0 4px ${churnRisk.variant === "good" ? "var(--good-soft)" : churnRisk.variant === "warn" ? "var(--warn-soft)" : "var(--bad-soft)"}`,
              }}
            />
            <span className="text-[14px] font-bold">{churnRisk.label}</span>
          </div>
          <div className="mt-0.5 text-[11px] text-fg-muted">
            {churnRisk.reason}
          </div>
        </div>

        <div className="rounded-md bg-surface p-4 shadow-fc-1">
          <h4 className="mb-2.5 text-[11px] font-semibold uppercase tracking-widest2 text-fg-muted">
            Lifetime
          </h4>
          <Stat label="Total visits" value={data.totalCheckins} />
          <Stat label="Lifetime paid" value={fmtMoney(data.lifetimePaid, "TRY")} />
        </div>
      </aside>
    </div>
  );
}

function Fact({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 py-1.5 text-xs">
      <span className="text-fg-muted">{label}</span>
      <span className="text-right font-semibold">{value}</span>
    </div>
  );
}

function Stat({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between border-b border-[var(--border-faint)] py-1.5 text-xs last:border-0">
      <span className="text-fg-muted">{label}</span>
      <span className="font-bold tnum">{value}</span>
    </div>
  );
}
