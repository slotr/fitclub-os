import { desc, eq, gte, sql } from "drizzle-orm";
import { checkins, members } from "@fitness/db";
import { withTenantScope } from "@/lib/db";
import { getCurrentTenantId } from "@/lib/tenant";
import { manualCheckinAction } from "./_actions";
import { Pill } from "@/components/admin/pill";
import { DataTable, Td, Th, TrRow } from "@/components/admin/data-table";
import { SearchIcon } from "@/components/admin/icons";

function fmt(d: Date) {
  return new Date(d).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function CheckinsPage() {
  const tenantId = await getCurrentTenantId();
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const { rows, todayCount, total } = await withTenantScope(
    tenantId,
    async (db) => {
      const list = await db
        .select({
          id: checkins.id,
          at: checkins.checkedInAt,
          member: members.fullName,
          source: checkins.source,
          gateId: checkins.gateId,
        })
        .from(checkins)
        .innerJoin(members, eq(members.id, checkins.memberId))
        .orderBy(desc(checkins.checkedInAt))
        .limit(60);
      const [t] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(checkins)
        .where(gte(checkins.checkedInAt, startOfDay));
      const [tot] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(checkins);
      return {
        rows: list,
        todayCount: t?.count ?? 0,
        total: tot?.count ?? 0,
      };
    },
  );

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-[22px] font-extrabold tracking-tighter">
            Check-ins
          </h1>
          <p className="mt-1 text-[12px] text-fg-muted tnum">
            Today: {todayCount.toLocaleString("en-US")} · last 60 visible · live
            feed
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider2 text-fg-muted">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-good" />
          Live
        </span>
      </div>

      <div className="grid grid-cols-[1fr_320px] gap-4">
        <div className="space-y-3">
          <div className="flex items-center gap-2.5 rounded-md bg-surface p-3 shadow-fc-1">
            <FilterChip>Date range: Last 7 days ▾</FilterChip>
            <FilterChip>Source: All ▾</FilterChip>
            <FilterChip>Gate: All ▾</FilterChip>
            <button className="ml-auto h-8 rounded-sm border border-[var(--border-color)] bg-surface px-3 text-xs font-semibold hover:bg-[#faf9f7]">
              Export CSV
            </button>
          </div>

          <DataTable>
            <thead>
              <tr>
                <Th className="w-40">Date &amp; time</Th>
                <Th>Member</Th>
                <Th>Source</Th>
                <Th>Gate</Th>
                <Th className="w-32">Note</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <TrRow key={r.id}>
                  <Td className="tnum">{fmt(r.at)}</Td>
                  <Td>{r.member}</Td>
                  <Td>
                    <Pill
                      variant={
                        r.source === "manual" ? "dark" : "outline"
                      }
                    >
                      {r.source.toUpperCase()}
                    </Pill>
                  </Td>
                  <Td>{r.gateId ?? "Main entrance"}</Td>
                  <Td className="text-fg-faint">—</Td>
                </TrRow>
              ))}
              {rows.length === 0 && (
                <TrRow>
                  <Td colSpan={5} className="py-12 text-center text-fg-muted">
                    No check-ins yet today.
                  </Td>
                </TrRow>
              )}
            </tbody>
          </DataTable>

          <div className="flex items-center justify-between text-xs text-fg-muted">
            <span>
              Showing 1–{Math.min(60, rows.length)} of {total.toLocaleString("en-US")}{" "}
              check-ins
            </span>
            <span>Page 1</span>
          </div>
        </div>

        <aside className="self-start rounded-md bg-surface p-4 shadow-fc-1">
          <h3 className="text-[13px] font-bold">Manual check-in</h3>
          <p className="mt-1 text-[12px] text-fg-muted">
            Use when QR fails or for guest passes.
          </p>
          <form
            action={async (fd) => {
              "use server";
              await manualCheckinAction(fd);
            }}
            className="mt-4 space-y-3"
          >
            <Field
              label="Member ID"
              name="memberId"
              icon={<SearchIcon className="h-3.5 w-3.5" />}
              placeholder="M-1042 or member UUID"
              required
            />
            <Field
              label="Gate"
              name="gateId"
              placeholder="Main entrance"
            />
            <button
              type="submit"
              className="h-10 w-full rounded-sm bg-fg text-sm font-semibold text-surface hover:opacity-90"
            >
              Mark check-in
            </button>
          </form>
        </aside>
      </div>
    </div>
  );
}

function FilterChip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex h-8 items-center gap-1.5 rounded-sm bg-bg px-3 text-xs font-medium text-fg cursor-pointer">
      {children}
    </span>
  );
}

function Field({
  label,
  name,
  placeholder,
  required,
  icon,
}: {
  label: string;
  name: string;
  placeholder?: string;
  required?: boolean;
  icon?: React.ReactNode;
}) {
  return (
    <div>
      <label
        htmlFor={name}
        className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider2 text-fg-muted"
      >
        {label}
      </label>
      <div className="flex h-9 items-center gap-2 rounded-sm border border-[var(--border-color)] bg-bg px-2.5 text-[13px] text-fg-muted focus-within:border-fg focus-within:text-fg">
        {icon}
        <input
          id={name}
          name={name}
          placeholder={placeholder}
          required={required}
          className="flex-1 bg-transparent text-fg outline-none placeholder:text-fg-faint"
        />
      </div>
    </div>
  );
}
