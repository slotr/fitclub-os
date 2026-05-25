import { and, asc, count, eq, isNull, sql } from "drizzle-orm";
import { notFound } from "next/navigation";
import {
  challengeParticipants, challenges, exercises,
} from "@fitness/db";
import { withTenantScope } from "@/lib/db";
import { getCurrentTenantId } from "@/lib/tenant";
import {
  endChallengeAction, publishChallengeAction, updateChallengeAction,
} from "../_actions";

type LeaderboardRow = {
  member_id: string;
  member_name: string;
  score: string;
  rank: number;
};

export default async function ChallengeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const tenantId = await getCurrentTenantId();
  if (!tenantId) notFound();

  const row = await withTenantScope(tenantId, async (db) => {
    const [c] = await db
      .select()
      .from(challenges)
      .where(
        and(eq(challenges.id, id), eq(challenges.tenantId, tenantId)),
      );
    return c;
  });
  if (!row) notFound();

  const [participantCount, exerciseList, top5] = await withTenantScope(
    tenantId,
    async (db) => {
      const [p] = await db
        .select({ n: count() })
        .from(challengeParticipants)
        .where(eq(challengeParticipants.challengeId, id));
      const ex = await db
        .select({ id: exercises.id, name: exercises.name })
        .from(exercises)
        .where(isNull(exercises.deletedAt))
        .orderBy(asc(exercises.name));
      const lb = await db.execute<LeaderboardRow>(
        sql`select * from public.challenge_leaderboard(${id}::uuid) limit 5`,
      );
      // postgres-js + drizzle execute may return array or { rows } wrapper
      const lbRows = Array.isArray(lb) ? lb : ((lb as unknown as { rows?: LeaderboardRow[] }).rows ?? []);
      return [p?.n ?? 0, ex, lbRows] as const;
    },
  );

  const draft = row.status === "draft";
  const ended = row.status === "ended" || row.status === "cancelled";
  const daysLeft = Math.max(
    0,
    Math.ceil(
      (row.endsAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24),
    ),
  );

  async function update(formData: FormData) {
    "use server";
    await updateChallengeAction(id, formData);
  }
  async function publish() {
    "use server";
    await publishChallengeAction(id);
  }
  async function end() {
    "use server";
    await endChallengeAction(id);
  }

  return (
    <div className="max-w-[760px] px-8 py-7">
      <h1 className="text-[22px] font-extrabold tracking-tighter">
        {row.name}
      </h1>
      <p className="mb-4 mt-1 text-[12px] text-fg-muted">
        {row.metricType} · {row.startsAt.toISOString().slice(0, 10)} →{" "}
        {row.endsAt.toISOString().slice(0, 10)} · {row.status}
      </p>

      <div className="mb-5 grid grid-cols-3 gap-3">
        <Stat label="Participants" value={String(participantCount)} />
        <Stat
          label="Days remaining"
          value={ended ? "—" : `${daysLeft}`}
        />
        <Stat label="Status" value={row.status} />
      </div>

      <div className="mb-6 rounded-md bg-surface p-4 shadow-fc-1">
        <h2 className="mb-2 text-[12px] font-bold uppercase tracking-wider2 text-fg-muted">
          Top 5
        </h2>
        {top5.length > 0 ? (
          <ol className="space-y-1 text-[13px]">
            {top5.map((r) => (
              <li key={r.member_id}>
                {r.rank}. <span className="font-semibold">{r.member_name}</span>{" "}
                — <span className="tnum">{Number(r.score).toLocaleString("en-US")}</span>
              </li>
            ))}
          </ol>
        ) : (
          <p className="text-[13px] text-fg-muted">No participants yet.</p>
        )}
      </div>

      <form action={update} className="space-y-4">
        <div>
          <label
            htmlFor="name"
            className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider2 text-fg-muted"
          >
            Name
          </label>
          <input
            id="name"
            name="name"
            defaultValue={row.name}
            className="block h-10 w-full rounded-sm border border-[var(--border-color)] bg-bg px-3 text-[13px]"
          />
        </div>

        <div>
          <label
            htmlFor="description"
            className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider2 text-fg-muted"
          >
            Description
          </label>
          <textarea
            id="description"
            name="description"
            rows={4}
            defaultValue={row.description ?? ""}
            className="block w-full rounded-sm border border-[var(--border-color)] bg-bg px-3 py-2 text-[13px]"
          />
        </div>

        <fieldset disabled={!draft} className="space-y-4 disabled:opacity-50">
          <div>
            <label
              htmlFor="metricType"
              className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider2 text-fg-muted"
            >
              Metric
            </label>
            <select
              id="metricType"
              name="metricType"
              defaultValue={row.metricType}
              className="block h-10 w-full rounded-sm border border-[var(--border-color)] bg-bg px-3 text-[13px]"
            >
              {["volume", "workout_count", "max_weight", "streak_weeks"].map(
                (m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ),
              )}
            </select>
          </div>
          <div>
            <label
              htmlFor="exerciseId"
              className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider2 text-fg-muted"
            >
              Exercise
            </label>
            <select
              id="exerciseId"
              name="exerciseId"
              defaultValue={row.exerciseId ?? ""}
              className="block h-10 w-full rounded-sm border border-[var(--border-color)] bg-bg px-3 text-[13px]"
            >
              <option value="">— none —</option>
              {exerciseList.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider2 text-fg-muted">
                Start
              </label>
              <input
                name="startsAt"
                type="datetime-local"
                defaultValue={row.startsAt.toISOString().slice(0, 16)}
                className="block h-10 w-full rounded-sm border border-[var(--border-color)] bg-bg px-3 text-[13px]"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider2 text-fg-muted">
                End
              </label>
              <input
                name="endsAt"
                type="datetime-local"
                defaultValue={row.endsAt.toISOString().slice(0, 16)}
                className="block h-10 w-full rounded-sm border border-[var(--border-color)] bg-bg px-3 text-[13px]"
              />
            </div>
          </div>
        </fieldset>
        {!draft && (
          <p className="text-[11px] text-fg-muted">
            Metric, exercise, and window cannot be changed after publishing.
          </p>
        )}

        <div className="flex items-center gap-2 border-t border-[var(--border-color)] pt-4">
          <button
            type="submit"
            className="inline-flex h-10 items-center rounded-sm bg-fg px-5 text-sm font-semibold text-surface"
          >
            Save changes
          </button>
          {draft ? (
            <button
              type="button"
              formAction={publish}
              className="inline-flex h-10 items-center rounded-sm bg-amber px-5 text-sm font-semibold text-fg"
            >
              Publish
            </button>
          ) : !ended ? (
            <button
              type="button"
              formAction={end}
              className="inline-flex h-10 items-center rounded-sm border border-[var(--border-color)] bg-surface px-4 text-sm font-semibold text-bad"
            >
              End early
            </button>
          ) : null}
        </div>
      </form>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-sm bg-surface p-3 shadow-fc-1">
      <div className="text-[18px] font-extrabold">{value}</div>
      <div className="text-[10px] font-semibold uppercase tracking-wider2 text-fg-muted">
        {label}
      </div>
    </div>
  );
}
