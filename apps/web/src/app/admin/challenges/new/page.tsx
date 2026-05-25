import { asc, isNull } from "drizzle-orm";
import { exercises } from "@fitness/db";
import { withTenantScope } from "@/lib/db";
import { getCurrentTenantId } from "@/lib/tenant";
import { createChallengeAction } from "../_actions";

export default async function NewChallengePage() {
  const tenantId = await getCurrentTenantId();
  const exerciseList = tenantId
    ? await withTenantScope(tenantId, async (db) =>
        db
          .select({ id: exercises.id, name: exercises.name })
          .from(exercises)
          .where(isNull(exercises.deletedAt))
          .orderBy(asc(exercises.name)),
      )
    : [];

  async function action(formData: FormData) {
    "use server";
    await createChallengeAction(formData);
  }

  return (
    <div className="px-8 py-7">
      <h1 className="text-[22px] font-extrabold tracking-tighter">
        New challenge
      </h1>
      <p className="mb-5 mt-1 text-[13px] text-fg-muted">
        Define metric, window, and description. Members will see this in
        the mobile Train tab once published.
      </p>

      <form action={action} className="max-w-[640px] space-y-4">
        <Field label="Name" name="name" required />
        <div>
          <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider2 text-fg-muted">
            Metric
          </label>
          <div className="grid grid-cols-4 overflow-hidden rounded-sm ring-1 ring-[var(--border-color)]">
            {(["volume", "workout_count", "max_weight", "streak_weeks"] as const).map(
              (m, i) => (
                <label
                  key={m}
                  className="cursor-pointer text-center text-[12px] font-bold has-[:checked]:bg-fg has-[:checked]:text-surface"
                >
                  <input
                    type="radio"
                    name="metricType"
                    value={m}
                    defaultChecked={i === 0}
                    className="hidden"
                  />
                  <span className="block py-2 ring-1 ring-[var(--border-faint)]">
                    {m}
                  </span>
                </label>
              ),
            )}
          </div>
        </div>

        <div>
          <label
            htmlFor="exerciseId"
            className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider2 text-fg-muted"
          >
            Exercise (only required for <code>max_weight</code>)
          </label>
          <select
            id="exerciseId"
            name="exerciseId"
            className="block h-10 w-full rounded-sm border border-[var(--border-color)] bg-bg px-3 text-[13px]"
            defaultValue=""
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
          <Field
            label="Start"
            name="startsAt"
            type="datetime-local"
            required
          />
          <Field
            label="End"
            name="endsAt"
            type="datetime-local"
            required
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
            className="block w-full rounded-sm border border-[var(--border-color)] bg-bg px-3 py-2 text-[13px]"
          />
        </div>

        <div className="flex items-center gap-2 border-t border-[var(--border-color)] pt-4">
          <button
            type="submit"
            name="publish"
            value="0"
            className="inline-flex h-10 items-center rounded-sm border border-[var(--border-color)] bg-surface px-4 text-sm font-semibold"
          >
            Save as draft
          </button>
          <button
            type="submit"
            name="publish"
            value="1"
            className="inline-flex h-10 items-center rounded-sm bg-amber px-5 text-sm font-semibold text-fg"
          >
            Publish
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({
  label,
  name,
  type = "text",
  required,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label
        htmlFor={name}
        className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider2 text-fg-muted"
      >
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        required={required}
        className="block h-10 w-full rounded-sm border border-[var(--border-color)] bg-bg px-3 text-[13px]"
      />
    </div>
  );
}
