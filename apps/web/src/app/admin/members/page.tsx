import Link from "next/link";
import { desc, eq, ilike, or, sql } from "drizzle-orm";
import { members, memberships, plans } from "@fitness/db";
import { withTenantScope } from "@/lib/db";
import { getCurrentTenantId } from "@/lib/tenant";
import { MembersTable } from "./_components/members-table";
import { SearchIcon, PlusIcon } from "@/components/admin/icons";
import { Seg } from "@/components/admin/seg";

export default async function MembersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const sp = await searchParams;
  const q = sp.q?.trim() ?? "";
  const tenantId = await getCurrentTenantId();

  const { rows, total } = await withTenantScope(tenantId, async (db) => {
    const filters = q
      ? or(
          ilike(members.fullName, `%${q}%`),
          ilike(members.email, `%${q}%`),
          ilike(members.phone, `%${q}%`),
        )
      : undefined;
    const list = await db
      .select({
        id: members.id,
        fullName: members.fullName,
        email: members.email,
        phone: members.phone,
        status: members.status,
        joinedAt: members.joinedAt,
        planName: plans.name,
        membershipStatus: memberships.status,
      })
      .from(members)
      .leftJoin(memberships, eq(memberships.memberId, members.id))
      .leftJoin(plans, eq(plans.id, memberships.planId))
      .where(filters)
      .orderBy(desc(members.joinedAt))
      .limit(50);
    const [agg] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(members)
      .where(filters);
    return { rows: list, total: agg?.count ?? 0 };
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-[22px] font-extrabold tracking-tighter">
          Members
        </h1>
        <Link
          href={"/admin/members/new" as Parameters<typeof Link>[0]["href"]}
          className="inline-flex h-8 items-center gap-1.5 rounded-sm bg-fg px-3 text-xs font-semibold text-surface hover:opacity-90"
        >
          <PlusIcon className="h-3.5 w-3.5" />
          New member
        </Link>
      </div>

      <form className="flex items-center gap-2.5 rounded-md bg-surface p-3 shadow-fc-1">
        <label className="flex h-9 flex-1 items-center gap-2 rounded-sm bg-bg px-3 text-[13px] text-fg-muted focus-within:text-fg">
          <SearchIcon className="h-3.5 w-3.5" />
          <input
            name="q"
            defaultValue={q}
            placeholder="Search by name, email, phone…"
            className="flex-1 bg-transparent text-fg outline-none placeholder:text-fg-muted"
          />
        </label>
        <FilterChip>Status: All ▾</FilterChip>
        <FilterChip>Plan: All ▾</FilterChip>
        <FilterChip>Joined: All-time ▾</FilterChip>
        <div className="ml-auto">
          <Seg options={["List", "Cards"] as const} value="List" />
        </div>
      </form>

      <MembersTable rows={rows} />

      <div className="flex items-center justify-between text-xs text-fg-muted">
        <span>
          Showing 1–{Math.min(rows.length, 50)} of {total.toLocaleString("en-US")}{" "}
          members
        </span>
        <Seg
          options={["1", "2", "3", "…", String(Math.max(1, Math.ceil(total / 50)))] as const}
          value="1"
          size="sm"
        />
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
