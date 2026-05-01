import { eq } from "drizzle-orm";
import { notificationTemplates } from "@fitness/db";
import { withTenantScope } from "@/lib/db";
import { getCurrentTenantId } from "@/lib/tenant";
import { Pill } from "@/components/admin/pill";
import { stubSaveTemplateAction, stubSendTestAction } from "./_actions";

const KEY_LABELS: Record<string, { title: string; desc: string }> = {
  welcome: {
    title: "Welcome",
    desc: "Sent right after a member completes onboarding.",
  },
  renewal_reminder: {
    title: "Renewal reminder",
    desc: "Fires 7 days before plan renewal.",
  },
  payment_failed: {
    title: "Payment failed",
    desc: "Triggered by Stripe webhook on first card decline.",
  },
  class_reminder: {
    title: "Class reminder",
    desc: "Goes out 90 min before a booked class.",
  },
  waitlist_promoted: {
    title: "Waitlist promoted",
    desc: "Tells the member they got off the waitlist.",
  },
};

const CHANNEL_LABEL: Record<string, string> = {
  push: "Push",
  sms: "SMS",
  whatsapp: "WhatsApp",
  email: "Email",
};

export default async function NotificationsPage({
  searchParams,
}: {
  searchParams: Promise<{ key?: string; channel?: string }>;
}) {
  const sp = await searchParams;
  const tenantId = await getCurrentTenantId();

  const templates = await withTenantScope(tenantId, async (db) =>
    db.select().from(notificationTemplates).orderBy(notificationTemplates.key),
  );

  const grouped = new Map<string, typeof templates>();
  for (const t of templates) {
    const list = grouped.get(t.key) ?? [];
    list.push(t);
    grouped.set(t.key, list);
  }

  const selectedKey = sp.key ?? Array.from(grouped.keys())[0] ?? "welcome";
  const channels = grouped.get(selectedKey) ?? [];
  const selectedChannel =
    channels.find((c) => c.channel === sp.channel) ?? channels[0];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-[22px] font-extrabold tracking-tighter">
          Notifications
        </h1>
        <p className="mt-1 text-[13px] text-fg-muted">
          Multi-channel templates · push, SMS, WhatsApp, email.
        </p>
      </div>

      <div className="grid grid-cols-[280px_1fr_320px] gap-4">
        {/* Template list */}
        <aside className="rounded-md bg-surface p-2 shadow-fc-1">
          {Array.from(grouped.entries()).map(([key, list]) => {
            const label = KEY_LABELS[key] ?? {
              title: key,
              desc: "—",
            };
            const active = key === selectedKey;
            return (
              <a
                key={key}
                href={`/admin/notifications?key=${key}`}
                className={`block rounded-sm px-3 py-2.5 text-[13px] transition-colors ${
                  active
                    ? "bg-[#faf9f7]"
                    : "hover:bg-[#faf9f7]"
                }`}
              >
                <div className="font-semibold">{label.title}</div>
                <div className="mt-0.5 text-[11px] text-fg-muted">
                  {label.desc}
                </div>
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {list.map((c) => (
                    <Pill
                      key={c.id}
                      variant={c.enabled ? "info" : "outline"}
                    >
                      {CHANNEL_LABEL[c.channel]}
                    </Pill>
                  ))}
                </div>
              </a>
            );
          })}
          {grouped.size === 0 && (
            <p className="px-3 py-6 text-center text-xs text-fg-muted">
              No templates yet.
            </p>
          )}
        </aside>

        {/* Editor */}
        <section className="rounded-md bg-surface p-5 shadow-fc-1">
          {!selectedChannel ? (
            <p className="text-fg-muted">Pick a template.</p>
          ) : (
            <form
              action={async (fd) => {
                "use server";
                await stubSaveTemplateAction(selectedChannel.id, fd);
              }}
              className="space-y-4"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-[16px] font-bold">
                    {KEY_LABELS[selectedKey]?.title ?? selectedKey}
                  </h2>
                  <p className="mt-0.5 text-[12px] text-fg-muted">
                    {KEY_LABELS[selectedKey]?.desc}
                  </p>
                </div>
                <label className="inline-flex items-center gap-2 text-[12px]">
                  <input
                    type="checkbox"
                    name="enabled"
                    defaultChecked={selectedChannel.enabled}
                    className="h-4 w-4 accent-amber"
                  />
                  Enabled
                </label>
              </div>

              <div className="flex gap-1.5 border-b border-[var(--border-color)]">
                {channels.map((c) => (
                  <a
                    key={c.id}
                    href={`/admin/notifications?key=${selectedKey}&channel=${c.channel}`}
                    className={`-mb-px border-b-2 px-3 py-2 text-[13px] font-semibold ${
                      c.id === selectedChannel.id
                        ? "border-fg text-fg"
                        : "border-transparent text-fg-muted hover:text-fg"
                    }`}
                  >
                    {CHANNEL_LABEL[c.channel]}
                  </a>
                ))}
              </div>

              {selectedChannel.channel === "email" && (
                <div>
                  <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider2 text-fg-muted">
                    Subject
                  </label>
                  <input
                    name="subject"
                    defaultValue={selectedChannel.subject ?? ""}
                    className="block h-10 w-full rounded-sm border border-[var(--border-color)] bg-bg px-3 text-[13px] focus:border-fg focus:outline-none"
                  />
                </div>
              )}

              <div>
                <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider2 text-fg-muted">
                  Body
                </label>
                <textarea
                  name="body"
                  defaultValue={selectedChannel.body}
                  rows={selectedChannel.channel === "email" ? 12 : 5}
                  className="block w-full rounded-sm border border-[var(--border-color)] bg-bg p-3 font-mono text-[13px] focus:border-fg focus:outline-none"
                />
                {selectedChannel.variables.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {selectedChannel.variables.map((v) => (
                      <span
                        key={v}
                        className="rounded-sm bg-[#faf9f7] px-2 py-1 font-mono text-[11px] text-fg-muted"
                      >
                        {`{{${v}}}`}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-[var(--border-color)] pt-3">
                <button
                  type="button"
                  formAction={async () => {
                    "use server";
                    await stubSendTestAction(selectedChannel.id);
                  }}
                  className="h-9 rounded-sm border border-[var(--border-color)] bg-surface px-3.5 text-[13px] font-semibold hover:bg-[#faf9f7]"
                >
                  Send test
                </button>
                <button
                  type="submit"
                  className="h-9 rounded-sm bg-fg px-4 text-[13px] font-semibold text-surface hover:opacity-90"
                >
                  Save changes
                </button>
              </div>
            </form>
          )}
        </section>

        {/* Preview */}
        <aside className="rounded-md bg-surface p-4 shadow-fc-1">
          <h4 className="mb-3 text-[11px] font-semibold uppercase tracking-widest2 text-fg-muted">
            Preview
          </h4>
          <div className="rounded-sm bg-[#faf9f7] p-4 text-[13px] leading-relaxed">
            {selectedChannel?.channel === "email" && (
              <div className="mb-2 border-b border-[var(--border-color)] pb-2 text-[12px] font-semibold">
                {selectedChannel.subject ?? "Subject"}
              </div>
            )}
            <p className="whitespace-pre-wrap font-mono text-[12px]">
              {selectedChannel?.body ?? "—"}
            </p>
          </div>
          <div className="mt-4 text-[11px] text-fg-muted">
            Variables resolve at send time. Test with{" "}
            <span className="font-mono">Send test</span>.
          </div>
        </aside>
      </div>
    </div>
  );
}
