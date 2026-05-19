import Link from "next/link";
import { desc, eq, sql } from "drizzle-orm";
import { plans, memberships, members } from "@fitness/db";
import { withTenantScope } from "@/lib/db";
import { getCurrentTenantId } from "@/lib/tenant";
import { PlusIcon } from "@/components/admin/icons";
import { cn } from "@/lib/utils";
import { formatMoney, getStudioCurrency } from "@/lib/money";

export default async function PlansPage() {
  const tenantId = await getCurrentTenantId();
  const studioCurrency = await getStudioCurrency();

  const { rows, totalMembers } = await withTenantScope(tenantId, async (db) => {
    const planRows = await db
      .select({
        id: plans.id,
        name: plans.name,
        priceMinor: plans.priceMinor,
        currency: plans.currency,
        durationDays: plans.durationDays,
        features: plans.features,
        active: plans.active,
        memberCount: sql<number>`coalesce(
          (select count(*)::int from ${memberships} ms where ms.plan_id = ${plans.id} and ms.status = 'active'),
          0
        )`,
      })
      .from(plans)
      .orderBy(desc(plans.priceMinor));
    const [tot] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(members)
      .where(eq(members.status, "active"));
    return { rows: planRows, totalMembers: tot?.count ?? 0 };
  });

  const activeCount = rows.filter((r) => r.active).length;

  // Pick a "featured" plan: highest member count.
  const featuredId = rows.length
    ? rows.reduce((a, b) => (a.memberCount > b.memberCount ? a : b)).id
    : null;

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-[22px] font-extrabold tracking-tighter">Plans</h1>
          <p className="mt-1 text-[12px] text-fg-muted tnum">
            {activeCount} active plans · {totalMembers.toLocaleString("en-US")} total
            members · drag to reorder
          </p>
        </div>
        <Link
          href={"/admin/plans/new" as Parameters<typeof Link>[0]["href"]}
          className="inline-flex h-9 items-center gap-1.5 rounded-sm bg-fg px-3.5 text-[13px] font-semibold text-surface hover:opacity-90"
        >
          <PlusIcon className="h-3.5 w-3.5" />
          New plan
        </Link>
      </div>

      <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-4">
        {rows.map((p) => {
          const featured = p.id === featuredId;
          return (
            <div
              key={p.id}
              className={cn(
                "relative flex min-h-[380px] flex-col rounded-lg p-6 shadow-fc-1",
                featured
                  ? "border-2 border-amber bg-surface"
                  : "bg-surface",
              )}
            >
              {featured && (
                <span className="absolute -top-2.5 left-5 rounded-pill bg-amber px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider2 text-fg">
                  Most popular
                </span>
              )}
              <div className="flex items-center justify-between">
                <span className="text-[16px] font-extrabold tracking-tighter">
                  {p.name}
                </span>
                <span
                  className={cn(
                    "h-3 w-5 rounded-full",
                    p.active ? "bg-good" : "bg-fg-faint",
                  )}
                  title={p.active ? "Active" : "Archived"}
                />
              </div>
              <div className="mt-3 flex items-baseline gap-1.5">
                <span className="text-[34px] font-extrabold tracking-tightest tnum">
                  {formatMoney(p.priceMinor, studioCurrency)}
                </span>
                <span className="text-[13px] text-fg-muted">
                  /{p.durationDays >= 28 ? "month" : `${p.durationDays}d`}
                </span>
              </div>
              <ul className="mt-4 flex-1 space-y-1">
                {(p.features ?? []).slice(0, 6).map((f, i) => (
                  <li
                    key={i}
                    className="flex gap-2 text-[13px] leading-snug"
                  >
                    <span className="text-amber">•</span>
                    {f}
                  </li>
                ))}
                {(!p.features || p.features.length === 0) && (
                  <li className="text-[12px] text-fg-faint">
                    No features defined.
                  </li>
                )}
              </ul>
              <div className="mt-4 flex items-center justify-between border-t border-[var(--border-faint)] pt-3 text-[12px]">
                <span className="text-fg-muted tnum">
                  <b className="text-fg font-bold">
                    {p.memberCount.toLocaleString("en-US")}
                  </b>{" "}
                  active members
                </span>
                <Link
                  href={"/admin/plans" as Parameters<typeof Link>[0]["href"]}
                  className="font-semibold hover:underline"
                >
                  Edit →
                </Link>
              </div>
            </div>
          );
        })}

        <Link
          href={"/admin/plans/new" as Parameters<typeof Link>[0]["href"]}
          className="flex min-h-[380px] flex-col items-center justify-center rounded-lg border-2 border-dashed border-[var(--border-color)] p-6 text-fg-muted transition-colors hover:border-amber hover:text-fg"
        >
          <span className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-full border border-[var(--border-color)] bg-surface text-[24px] font-semibold">
            +
          </span>
          <span className="text-[14px] font-semibold">New plan</span>
          <span className="mt-1 text-[12px] text-fg-muted">
            Add a tier or add-on
          </span>
        </Link>
      </div>
    </div>
  );
}
