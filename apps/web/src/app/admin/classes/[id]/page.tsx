import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import {
  bookings,
  classes,
  instructors,
  members,
  sessions,
  waitlist,
} from "@fitness/db";
import { withTenantScope } from "@/lib/db";
import { getCurrentTenantId } from "@/lib/tenant";
import { Pill } from "@/components/admin/pill";
import { Avatar } from "@/components/admin/avatar";
import { DataTable, Td, Th, TrRow } from "@/components/admin/data-table";

function fmt(d: Date) {
  return new Date(d).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function pillForBooking(
  status: "booked" | "cancelled" | "attended" | "no_show",
): {
  variant: "good" | "warn" | "bad" | "info" | "outline";
  label: string;
} {
  switch (status) {
    case "attended":
      return { variant: "good", label: "Attended" };
    case "booked":
      return { variant: "info", label: "Booked" };
    case "cancelled":
      return { variant: "outline", label: "Cancelled" };
    case "no_show":
      return { variant: "bad", label: "No-show" };
  }
}

export default async function SessionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const tenantId = await getCurrentTenantId();

  const data = await withTenantScope(tenantId, async (db) => {
    const [s] = await db
      .select({
        id: sessions.id,
        startsAt: sessions.startsAt,
        endsAt: sessions.endsAt,
        capacity: sessions.capacity,
        room: sessions.room,
        notes: sessions.notes,
        status: sessions.status,
        category: classes.category,
        className: classes.name,
        instructor: instructors.name,
      })
      .from(sessions)
      .innerJoin(classes, eq(classes.id, sessions.classId))
      .leftJoin(instructors, eq(instructors.id, sessions.instructorId))
      .where(eq(sessions.id, id))
      .limit(1);
    if (!s) return null;
    const roster = await db
      .select({
        id: bookings.id,
        memberId: bookings.memberId,
        status: bookings.status,
        bookedAt: bookings.bookedAt,
        memberName: members.fullName,
        memberEmail: members.email,
      })
      .from(bookings)
      .innerJoin(members, eq(members.id, bookings.memberId))
      .where(eq(bookings.sessionId, id))
      .orderBy(bookings.bookedAt);
    const wait = await db
      .select({
        id: waitlist.id,
        memberId: waitlist.memberId,
        position: waitlist.position,
        joinedAt: waitlist.joinedAt,
        memberName: members.fullName,
      })
      .from(waitlist)
      .innerJoin(members, eq(members.id, waitlist.memberId))
      .where(eq(waitlist.sessionId, id))
      .orderBy(waitlist.position);
    return { s, roster, wait };
  });

  if (!data) notFound();
  const { s, roster, wait } = data;
  const attended = roster.filter((r) => r.status === "attended").length;
  const booked = roster.filter(
    (r) => r.status === "booked" || r.status === "attended",
  ).length;
  const fillPct = Math.min(100, (booked / s.capacity) * 100);

  return (
    <div className="space-y-4">
      <div>
        <Link
          href={"/admin/classes" as Parameters<typeof Link>[0]["href"]}
          className="text-[12px] text-fg-muted hover:text-fg"
        >
          ← Schedule
        </Link>
        <h1 className="mt-1 text-[24px] font-extrabold tracking-tighter">
          {s.className}
        </h1>
        <p className="mt-1 text-[13px] text-fg-muted tnum">
          {fmt(s.startsAt)} – {new Date(s.endsAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })} · {s.instructor ?? "Unassigned"} · {s.room ?? "—"}
        </p>
      </div>

      <div className="grid grid-cols-[1fr_320px] gap-4">
        <section className="space-y-3">
          <div className="rounded-md bg-surface p-4 shadow-fc-1">
            <div className="flex items-center justify-between">
              <h3 className="text-[13px] font-bold">Roster</h3>
              <Pill variant={s.status === "scheduled" ? "info" : s.status === "completed" ? "good" : "outline"}>
                {s.status}
              </Pill>
            </div>
            <DataTable className="mt-3 shadow-none">
              <thead>
                <tr>
                  <Th>Member</Th>
                  <Th>Status</Th>
                  <Th className="w-32">Booked</Th>
                  <Th className="w-28 text-right">Actions</Th>
                </tr>
              </thead>
              <tbody>
                {roster.length === 0 && (
                  <TrRow>
                    <Td colSpan={4} className="py-6 text-center text-fg-muted">
                      No bookings yet.
                    </Td>
                  </TrRow>
                )}
                {roster.map((r) => {
                  const pill = pillForBooking(r.status);
                  return (
                    <TrRow key={r.id}>
                      <Td>
                        <div className="flex items-center gap-3">
                          <Avatar name={r.memberName} size={28} />
                          <div className="min-w-0">
                            <Link
                              href={
                                `/admin/members/${r.memberId}` as Parameters<
                                  typeof Link
                                >[0]["href"]
                              }
                              className="font-semibold leading-tight hover:underline"
                            >
                              {r.memberName}
                            </Link>
                            <div className="truncate text-[11px] text-fg-muted">
                              {r.memberEmail}
                            </div>
                          </div>
                        </div>
                      </Td>
                      <Td>
                        <Pill variant={pill.variant}>{pill.label}</Pill>
                      </Td>
                      <Td className="tnum">{fmt(r.bookedAt)}</Td>
                      <Td className="text-right">
                        <button className="rounded-sm border border-[var(--border-color)] bg-surface px-2.5 py-1 text-[11px] font-semibold hover:bg-[#faf9f7]">
                          {r.status === "attended" ? "Mark missed" : "Mark in"}
                        </button>
                      </Td>
                    </TrRow>
                  );
                })}
              </tbody>
            </DataTable>
          </div>

          <div className="rounded-md bg-surface p-4 shadow-fc-1">
            <h3 className="text-[13px] font-bold">Waitlist</h3>
            {wait.length === 0 ? (
              <p className="py-4 text-[12px] text-fg-muted">
                Nobody waiting.
              </p>
            ) : (
              <ul className="mt-3 divide-y divide-[var(--border-faint)]">
                {wait.map((w) => (
                  <li
                    key={w.id}
                    className="flex items-center justify-between py-2 text-[13px]"
                  >
                    <div className="flex items-center gap-3">
                      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-amber-soft text-[11px] font-bold text-fg tnum">
                        {w.position}
                      </span>
                      <span className="font-semibold">{w.memberName}</span>
                    </div>
                    <button className="text-[12px] font-semibold text-fg hover:underline">
                      Promote
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        <aside className="space-y-3">
          <div className="rounded-md bg-surface p-4 shadow-fc-1">
            <h4 className="mb-2.5 text-[11px] font-semibold uppercase tracking-widest2 text-fg-muted">
              Capacity
            </h4>
            <div className="flex items-baseline gap-1.5">
              <span className="text-[32px] font-extrabold tnum">
                {booked}
              </span>
              <span className="text-[16px] font-semibold text-fg-muted tnum">
                / {s.capacity}
              </span>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-pill bg-[var(--border-faint)]">
              <div
                className="h-full bg-amber"
                style={{ width: `${fillPct}%` }}
              />
            </div>
            <div className="mt-3 flex justify-between text-[11px] text-fg-muted tnum">
              <span>Attended {attended}</span>
              <span>Waitlist {wait.length}</span>
            </div>
          </div>

          <div className="rounded-md bg-surface p-4 shadow-fc-1">
            <h4 className="mb-2.5 text-[11px] font-semibold uppercase tracking-widest2 text-fg-muted">
              Notes
            </h4>
            <p className="text-[13px] text-fg">
              {s.notes ?? <span className="text-fg-muted">No notes.</span>}
            </p>
          </div>

          <div className="space-y-2">
            <button className="h-10 w-full rounded-sm border border-[var(--border-color)] bg-surface text-sm font-semibold hover:bg-[#faf9f7]">
              Send class reminder
            </button>
            <button className="h-10 w-full rounded-sm border border-[var(--border-color)] bg-surface text-sm font-semibold text-bad hover:bg-bad-soft/40">
              Cancel session
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}
