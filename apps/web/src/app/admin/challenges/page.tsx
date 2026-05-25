import Link from "next/link";
import { and, count, desc, eq, isNull } from "drizzle-orm";
import { challengeParticipants, challenges } from "@fitness/db";
import { withTenantScope } from "@/lib/db";
import { getCurrentTenantId } from "@/lib/tenant";
import { Pill } from "@/components/admin/pill";

type Status = "all" | "active" | "draft" | "ended";

const STATUS_LABELS: Record<Exclude<Status, "all">, string> = {
  active: "active",
  draft: "draft",
  ended: "ended",
};

function effectiveStatus(
  row: { status: string; endsAt: Date },
): "active" | "draft" | "ended" | "cancelled" {
  if (row.status === "active" && row.endsAt.getTime() < Date.now()) {
    return "ended";
  }
  return row.status as "active" | "draft" | "ended" | "cancelled";
}

function fmtDate(d: Date): string {
  const day = String(d.getUTCDate()).padStart(2, "0");
  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];
  return `${day} ${months[d.getUTCMonth()]}`;
}

export default async function ChallengesListPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: Status }>;
}) {
  const params = await searchParams;
  const status: Status = params.status ?? "all";
  const tenantId = await getCurrentTenantId();
  if (!tenantId) return null;

  const rows = await withTenantScope(tenantId, async (db) => {
    return db
      .select({
        id: challenges.id,
        name: challenges.name,
        metricType: challenges.metricType,
        exerciseId: challenges.exerciseId,
        startsAt: challenges.startsAt,
        endsAt: challenges.endsAt,
        status: challenges.status,
        playerCount: count(challengeParticipants.id),
      })
      .from(challenges)
      .leftJoin(
        challengeParticipants,
        eq(challengeParticipants.challengeId, challenges.id),
      )
      .where(
        and(
          eq(challenges.tenantId, tenantId),
          isNull(challenges.deletedAt),
        ),
      )
      .groupBy(challenges.id)
      .orderBy(desc(challenges.startsAt));
  });

  const visible = rows.filter((r) => {
    if (status === "all") return true;
    return effectiveStatus(r) === status;
  });

  return (
    <div className="px-8 py-7">
      <div className="mb-1 flex items-baseline justify-between">
        <h1 className="text-[22px] font-extrabold tracking-tighter">
          Challenges
        </h1>
        <Link
          href={"/admin/challenges/new" as Parameters<typeof Link>[0]["href"]}
          className="inline-flex h-9 items-center rounded-sm bg-fg px-4 text-[12px] font-semibold text-surface"
        >
          + New challenge
        </Link>
      </div>
      <p className="mb-4 text-[13px] text-fg-muted">
        Competitions powered by member workout data. Members opt in and
        rank live.
      </p>

      <div className="mb-4 flex gap-1.5 text-[12px] font-semibold">
        {(["all", "active", "draft", "ended"] as Status[]).map((s) => (
          <Link
            key={s}
            href={
              (s === "all"
                ? "/admin/challenges"
                : `/admin/challenges?status=${s}`) as Parameters<typeof Link>[0]["href"]
            }
            className={
              s === status
                ? "rounded-sm bg-fg px-3 py-1.5 text-surface"
                : "rounded-sm bg-surface px-3 py-1.5 text-fg-muted ring-1 ring-[var(--border-color)]"
            }
          >
            {s === "all" ? "All" : STATUS_LABELS[s as Exclude<Status, "all">]}
          </Link>
        ))}
      </div>

      <div className="overflow-hidden rounded-md bg-surface shadow-fc-1">
        <div className="grid grid-cols-[2fr_1fr_1.4fr_0.8fr_0.6fr] gap-3 border-b border-[var(--border-color)] px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider2 text-fg-muted">
          <span>Name</span>
          <span>Metric</span>
          <span>Window</span>
          <span>Status</span>
          <span>Players</span>
        </div>
        {visible.length === 0 ? (
          <div className="px-4 py-6 text-[13px] text-fg-muted">
            No challenges yet.
          </div>
        ) : (
          visible.map((r) => {
            const eff = effectiveStatus(r);
            return (
              <Link
                key={r.id}
                href={
                  `/admin/challenges/${r.id}` as Parameters<typeof Link>[0]["href"]
                }
                className="grid grid-cols-[2fr_1fr_1.4fr_0.8fr_0.6fr] items-center gap-3 border-b border-[var(--border-faint)] px-4 py-3 text-[13px] last:border-b-0 hover:bg-[#faf9f7]"
              >
                <span className="font-bold">{r.name}</span>
                <span className="text-fg-muted">{r.metricType}</span>
                <span className="text-fg-muted">
                  {fmtDate(r.startsAt)} → {fmtDate(r.endsAt)}
                </span>
                <Pill
                  variant={
                    eff === "active" ? "good" : eff === "draft" ? "outline" : "warn"
                  }
                >
                  {eff}
                </Pill>
                <span className="tnum">{r.playerCount}</span>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}
