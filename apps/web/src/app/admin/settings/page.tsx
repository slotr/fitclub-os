import { and, asc, eq, isNull } from "drizzle-orm";
import { instructors, studioSettings } from "@fitness/db";
import { withTenantScope } from "@/lib/db";
import { getCurrentTenantId } from "@/lib/tenant";
import { Avatar } from "@/components/admin/avatar";
import { Pill } from "@/components/admin/pill";
import { SettingsNav } from "./_nav";
import { stubSaveSettingsAction } from "./_actions";

const integrations = [
  { key: "stripe", label: "Stripe", desc: "Billing + subscriptions" },
  { key: "resend", label: "Resend", desc: "Transactional email" },
  { key: "twilio", label: "Twilio", desc: "SMS gateway" },
  { key: "whatsapp", label: "WhatsApp Business", desc: "Class reminders" },
  { key: "posthog", label: "PostHog", desc: "Product analytics" },
];

const DAYS = [
  { key: "mon", label: "Monday" },
  { key: "tue", label: "Tuesday" },
  { key: "wed", label: "Wednesday" },
  { key: "thu", label: "Thursday" },
  { key: "fri", label: "Friday" },
  { key: "sat", label: "Saturday" },
  { key: "sun", label: "Sunday" },
];

export default async function SettingsPage() {
  const tenantId = await getCurrentTenantId();
  const { settings, team } = await withTenantScope(tenantId, async (db) => {
    const [row] = await db
      .select()
      .from(studioSettings)
      .where(eq(studioSettings.tenantId, tenantId!))
      .limit(1);
    const staff = await db
      .select()
      .from(instructors)
      .where(
        and(
          eq(instructors.tenantId, tenantId!),
          isNull(instructors.archivedAt),
        ),
      )
      .orderBy(asc(instructors.name));
    return { settings: row ?? null, team: staff };
  });

  const hoursByDay = new Map(
    (settings?.hours ?? []).map((h) => [h.day, h]),
  );

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-[22px] font-extrabold tracking-tighter">
          Settings
        </h1>
        <p className="mt-1 text-[13px] text-fg-muted">
          Studio configuration · branding · integrations · security.
        </p>
      </div>

      <form
        action={async (fd) => {
          "use server";
          await stubSaveSettingsAction(fd);
        }}
        className="grid grid-cols-[180px_1fr] gap-6"
      >
        <SettingsNav />

        <div className="space-y-4">
          <Section
            id="studio"
            title="Studio"
            hint="Identity used on receipts and reminders."
          >
            <Field
              label="Studio name"
              name="name"
              defaultValue={settings?.name ?? "FitClub Beşiktaş"}
            />
            <Field
              label="Timezone"
              name="timezone"
              defaultValue={settings?.timezone ?? "Europe/Istanbul"}
            />
            <Field
              label="Locale"
              name="locale"
              defaultValue={settings?.locale ?? "en"}
            />
            <Field
              label="Currency"
              name="currency"
              defaultValue={settings?.currency ?? "TRY"}
            />
          </Section>

          <Section
            id="branding"
            title="Branding"
            hint="Affects member app + email templates."
          >
            <Field
              label="Accent color"
              name="accentColor"
              defaultValue={settings?.accentColor ?? "#f59e0b"}
            />
            <div>
              <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider2 text-fg-muted">
                Logo
              </label>
              <button
                type="button"
                className="flex h-10 w-full items-center justify-center rounded-sm border border-dashed border-[var(--border-color)] bg-bg text-[12px] font-semibold text-fg-muted hover:border-fg hover:text-fg"
              >
                Upload SVG / PNG
              </button>
            </div>
          </Section>

          <Section
            id="hours"
            title="Hours"
            hint="Shown in the member app and booking flow."
          >
            <div className="col-span-2 grid gap-2">
              <div className="grid grid-cols-[120px_1fr_1fr] gap-3 px-1 text-[11px] font-semibold uppercase tracking-wider2 text-fg-muted">
                <span>Day</span>
                <span>Open</span>
                <span>Close</span>
              </div>
              {DAYS.map((d) => {
                const row = hoursByDay.get(d.key);
                return (
                  <div
                    key={d.key}
                    className="grid grid-cols-[120px_1fr_1fr] items-center gap-3"
                  >
                    <span className="text-[13px] font-semibold">
                      {d.label}
                    </span>
                    <input
                      type="time"
                      name={`hours_${d.key}_open`}
                      defaultValue={row?.open ?? ""}
                      className="block h-10 w-full rounded-sm border border-[var(--border-color)] bg-bg px-3 text-[13px] text-fg outline-none focus:border-fg"
                    />
                    <input
                      type="time"
                      name={`hours_${d.key}_close`}
                      defaultValue={row?.close ?? ""}
                      className="block h-10 w-full rounded-sm border border-[var(--border-color)] bg-bg px-3 text-[13px] text-fg outline-none focus:border-fg"
                    />
                  </div>
                );
              })}
              <p className="px-1 text-[12px] text-fg-muted">
                Leave both fields empty to mark a day as closed.
              </p>
            </div>
          </Section>

          <Section
            id="integrations"
            title="Integrations"
            hint="Toggle channels and review connection status."
          >
            <div className="col-span-2 grid gap-2">
              {integrations.map((i) => (
                <div
                  key={i.key}
                  className="flex items-center justify-between rounded-sm border border-[var(--border-faint)] bg-bg px-4 py-3"
                >
                  <div>
                    <div className="text-[14px] font-semibold">{i.label}</div>
                    <div className="text-[12px] text-fg-muted">{i.desc}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Pill
                      variant={
                        ["stripe", "resend", "posthog"].includes(i.key)
                          ? "good"
                          : "outline"
                      }
                    >
                      {["stripe", "resend", "posthog"].includes(i.key)
                        ? "Connected"
                        : "Not connected"}
                    </Pill>
                    <button
                      type="button"
                      className="h-8 rounded-sm border border-[var(--border-color)] bg-surface px-3 text-[12px] font-semibold hover:bg-[#faf9f7]"
                    >
                      Configure
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </Section>

          <Section
            id="team"
            title="Team"
            hint="Instructors with studio access."
          >
            <div className="col-span-2 grid gap-2">
              {team.length === 0 ? (
                <p className="px-1 text-[13px] text-fg-muted">
                  No instructors yet. Add them from the Classes area.
                </p>
              ) : (
                team.map((m) => (
                  <div
                    key={m.id}
                    className="flex items-center justify-between rounded-sm border border-[var(--border-faint)] bg-bg px-4 py-3"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar name={m.name} size={36} />
                      <div>
                        <div className="text-[14px] font-semibold">
                          {m.name}
                        </div>
                        <div className="text-[12px] text-fg-muted">
                          {m.email ?? m.phone ?? "—"}
                        </div>
                      </div>
                    </div>
                    <Pill variant="outline">Instructor</Pill>
                  </div>
                ))
              )}
            </div>
          </Section>

          <Section
            id="security"
            title="Security"
            hint="Owner-only. Changes audit-logged."
          >
            <Toggle
              name="twoFactor"
              label="Require two-factor for staff"
              defaultChecked
            />
            <Toggle
              name="auditExport"
              label="Allow audit log export"
            />
            <Field
              label="Session timeout (min)"
              name="sessionTimeout"
              type="number"
              defaultValue="30"
            />
            <Field
              label="Allowed IPs (CSV)"
              name="allowedIps"
              placeholder="88.231.0.0/16"
            />
          </Section>

          <div className="flex items-center justify-end gap-2 border-t border-[var(--border-color)] pt-4">
            <button
              type="reset"
              className="inline-flex h-10 items-center rounded-sm border border-[var(--border-color)] bg-surface px-4 text-sm font-semibold hover:bg-[#faf9f7]"
            >
              Discard
            </button>
            <button
              type="submit"
              className="inline-flex h-10 items-center rounded-sm bg-fg px-5 text-sm font-semibold text-surface hover:opacity-90"
            >
              Save changes
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

function Section({
  id,
  title,
  hint,
  children,
}: {
  id: string;
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      id={id}
      className="scroll-mt-20 rounded-md bg-surface p-5 shadow-fc-1"
    >
      <div className="mb-4 flex items-baseline justify-between gap-4">
        <h2 className="text-[15px] font-bold tracking-tightish">{title}</h2>
        {hint && <span className="text-[12px] text-fg-muted">{hint}</span>}
      </div>
      <div className="grid grid-cols-2 gap-4">{children}</div>
    </section>
  );
}

function Field({
  label,
  name,
  type = "text",
  defaultValue,
  placeholder,
}: {
  label: string;
  name: string;
  type?: string;
  defaultValue?: string;
  placeholder?: string;
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
        defaultValue={defaultValue}
        placeholder={placeholder}
        className="block h-10 w-full rounded-sm border border-[var(--border-color)] bg-bg px-3 text-[13px] text-fg outline-none placeholder:text-fg-faint focus:border-fg"
      />
    </div>
  );
}

function Toggle({
  name,
  label,
  defaultChecked,
}: {
  name: string;
  label: string;
  defaultChecked?: boolean;
}) {
  return (
    <label className="col-span-2 flex items-center justify-between rounded-sm border border-[var(--border-faint)] bg-bg px-4 py-2.5 text-[13px]">
      <span className="font-medium">{label}</span>
      <input
        type="checkbox"
        name={name}
        defaultChecked={defaultChecked}
        className="h-4 w-4 accent-amber"
      />
    </label>
  );
}
