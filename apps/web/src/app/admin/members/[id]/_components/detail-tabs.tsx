"use client";

import Link from "next/link";
import { useState } from "react";
import { Pill } from "@/components/admin/pill";
import { cn } from "@/lib/utils";
import { formatMoney } from "@/lib/money-format";

type Tab = "Activity" | "Memberships" | "Payments" | "Check-ins" | "Notes";

type Event = {
  key: string;
  kind?: "checkin" | "payment" | "membership";
  dot: "green" | "amber" | "blue" | "purple" | "gray";
  title: string;
  detail?: string;
  when: Date;
};

type CheckinRow = {
  id: string;
  at: Date;
  source: string;
  gateId: string | null;
};

type PaymentRow = {
  id: string;
  amount: number;
  currency: string;
  status: "paid" | "failed" | "refunded" | "pending";
  createdAt: Date;
};

type MembershipRow = {
  id: string;
  status: "active" | "paused" | "past_due" | "cancelled";
  startedAt: Date;
  endsAt: Date | null;
  plan: string | null;
  priceMinor: number | null;
  currency: string | null;
};

function fmtDate(d: Date | null) {
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
function fmtMoney(minor: number, currency: string | null | undefined) {
  return formatMoney(minor, currency ?? "TRY");
}

const TABS: Tab[] = ["Activity", "Memberships", "Payments", "Check-ins", "Notes"];

export function DetailTabs({
  events,
  memberships,
  payments,
  checkins,
  notes,
  memberId,
}: {
  events: Event[];
  memberships: MembershipRow[];
  payments: PaymentRow[];
  checkins: CheckinRow[];
  notes: string | null;
  memberId: string;
}) {
  const [active, setActive] = useState<Tab>("Activity");
  const counts: Record<Tab, number> = {
    Activity: events.length,
    Memberships: memberships.length,
    Payments: payments.length,
    "Check-ins": checkins.length,
    Notes: notes ? 1 : 0,
  };

  return (
    <>
      <nav className="mb-4 flex border-b border-[var(--border-color)]">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setActive(t)}
            className={cn(
              "-mb-px cursor-pointer border-b-2 px-3.5 py-2.5 text-[13px] transition-colors",
              active === t
                ? "border-fg font-semibold text-fg"
                : "border-transparent font-medium text-fg-muted hover:text-fg",
            )}
          >
            {t}
            <span className="ml-1.5 text-[11px] text-fg-faint tnum">
              {counts[t]}
            </span>
          </button>
        ))}
      </nav>

      {active === "Activity" && <ActivityList events={events} />}
      {active === "Memberships" && <MembershipsList rows={memberships} />}
      {active === "Payments" && <PaymentsList rows={payments} />}
      {active === "Check-ins" && <CheckinsList rows={checkins} />}
      {active === "Notes" && <NotesPane notes={notes} memberId={memberId} />}
    </>
  );
}

function ActivityList({ events }: { events: Event[] }) {
  if (events.length === 0)
    return (
      <p className="py-8 text-center text-sm text-fg-muted">
        No activity yet.
      </p>
    );
  return (
    <div>
      {events.slice(0, 30).map((e) => (
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
              <div className="mt-0.5 text-[12px] text-fg-muted">{e.detail}</div>
            )}
          </div>
          <span className="whitespace-nowrap text-[12px] text-fg-muted tnum">
            {fmtDate(e.when)} · {fmtTime(e.when)}
          </span>
        </div>
      ))}
    </div>
  );
}

function MembershipsList({ rows }: { rows: MembershipRow[] }) {
  if (rows.length === 0)
    return (
      <p className="py-8 text-center text-sm text-fg-muted">
        No memberships yet.
      </p>
    );
  return (
    <div className="space-y-2">
      {rows.map((r) => (
        <div
          key={r.id}
          className="flex items-center justify-between rounded-sm border border-[var(--border-faint)] bg-bg px-4 py-3"
        >
          <div>
            <div className="text-[14px] font-bold">{r.plan ?? "—"}</div>
            <div className="text-[12px] text-fg-muted tnum">
              {fmtDate(r.startedAt)} → {fmtDate(r.endsAt)}
              {r.priceMinor && r.currency
                ? ` · ${fmtMoney(r.priceMinor, r.currency)}/mo`
                : ""}
            </div>
          </div>
          <Pill
            variant={
              r.status === "active"
                ? "good"
                : r.status === "paused"
                  ? "info"
                  : r.status === "past_due"
                    ? "warn"
                    : "bad"
            }
          >
            {r.status.replace("_", " ")}
          </Pill>
        </div>
      ))}
    </div>
  );
}

function PaymentsList({ rows }: { rows: PaymentRow[] }) {
  if (rows.length === 0)
    return (
      <p className="py-8 text-center text-sm text-fg-muted">
        No payments yet.
      </p>
    );
  return (
    <div className="space-y-1.5">
      {rows.map((p) => (
        <div
          key={p.id}
          className="flex items-center justify-between border-b border-[var(--border-faint)] py-2 text-[13px] last:border-0"
        >
          <div>
            <div className="font-semibold">{fmtMoney(p.amount, p.currency)}</div>
            <div className="text-[12px] text-fg-muted tnum">
              {fmtDate(p.createdAt)}
            </div>
          </div>
          <Pill
            variant={
              p.status === "paid"
                ? "good"
                : p.status === "failed"
                  ? "bad"
                  : p.status === "pending"
                    ? "warn"
                    : "info"
            }
          >
            {p.status}
          </Pill>
        </div>
      ))}
    </div>
  );
}

function CheckinsList({ rows }: { rows: CheckinRow[] }) {
  if (rows.length === 0)
    return (
      <p className="py-8 text-center text-sm text-fg-muted">
        No check-ins yet.
      </p>
    );
  return (
    <div className="space-y-1.5">
      {rows.map((c) => (
        <div
          key={c.id}
          className="flex items-center justify-between border-b border-[var(--border-faint)] py-2 text-[13px] last:border-0"
        >
          <div>
            <div className="font-semibold">
              {c.gateId ?? "Main entrance"}
            </div>
            <div className="text-[12px] text-fg-muted tnum">
              {fmtDate(c.at)} · {fmtTime(c.at)}
            </div>
          </div>
          <Pill variant={c.source === "manual" ? "dark" : "outline"}>
            {c.source.toUpperCase()}
          </Pill>
        </div>
      ))}
    </div>
  );
}

function NotesPane({
  notes,
  memberId,
}: {
  notes: string | null;
  memberId: string;
}) {
  return (
    <div className="space-y-3">
      <p className="rounded-sm bg-bg p-4 text-[13px] leading-relaxed">
        {notes && notes.length > 0 ? (
          notes
        ) : (
          <span className="text-fg-muted">
            No notes yet. Use this space for VIP preferences, injuries, or
            front-desk reminders.
          </span>
        )}
      </p>
      <Link
        href={`/admin/audit?targetId=${memberId}` as Parameters<typeof Link>[0]["href"]}
        className="inline-flex items-center text-[12px] font-semibold text-fg-muted hover:text-fg"
      >
        See full audit trail →
      </Link>
    </div>
  );
}
