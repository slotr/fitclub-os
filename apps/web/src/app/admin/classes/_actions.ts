"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, eq, ilike } from "drizzle-orm";
import { bookings, classes, instructors, sessions } from "@fitness/db";
import { logAudit } from "@/lib/audit";
import { withTenantScope } from "@/lib/db";
import { getCurrentTenantId } from "@/lib/tenant";

export async function stubSessionAction(formData: FormData) {
  const startsAtRaw = String(formData.get("startsAt") ?? "");
  const durationRaw = Number(formData.get("durationMin") ?? 60);
  const className = String(formData.get("className") ?? "").trim();
  const instructorName = String(formData.get("instructor") ?? "").trim();
  const room = String(formData.get("room") ?? "").trim() || null;
  const capacity = Math.max(1, Number(formData.get("capacity") ?? 12));

  if (!startsAtRaw || !className) {
    return { error: "startsAt and className required" };
  }
  const startsAt = new Date(startsAtRaw);
  if (Number.isNaN(startsAt.getTime())) {
    return { error: "invalid startsAt" };
  }
  const endsAt = new Date(startsAt.getTime() + durationRaw * 60_000);

  const tenantId = await getCurrentTenantId();
  const newId = await withTenantScope(tenantId, async (db) => {
    const [klass] = await db
      .select({ id: classes.id })
      .from(classes)
      .where(ilike(classes.name, className))
      .limit(1);
    if (!klass) {
      throw new Error(
        `class "${className}" not found — create it in seed first`,
      );
    }
    let instructorId: string | null = null;
    if (instructorName) {
      const [inst] = await db
        .select({ id: instructors.id })
        .from(instructors)
        .where(ilike(instructors.name, instructorName))
        .limit(1);
      instructorId = inst?.id ?? null;
    }
    const [created] = await db
      .insert(sessions)
      .values({
        tenantId: tenantId!,
        classId: klass.id,
        instructorId,
        startsAt,
        endsAt,
        capacity,
        room,
        status: "scheduled",
      })
      .returning({ id: sessions.id });
    return created?.id;
  });
  if (newId) {
    await logAudit("session.create", "session", newId, {
      className,
      startsAt: startsAt.toISOString(),
      capacity,
    });
  }
  revalidatePath("/admin/classes");
  redirect(newId ? `/admin/classes/${newId}` : "/admin/classes");
}

export async function stubMarkAttendedAction(
  bookingId: string,
  attended: boolean,
) {
  const tenantId = await getCurrentTenantId();
  await withTenantScope(tenantId, async (db) => {
    await db
      .update(bookings)
      .set({ status: attended ? "attended" : "no_show" })
      .where(eq(bookings.id, bookingId));
  });
  await logAudit(
    attended ? "booking.attended" : "booking.no_show",
    "booking",
    bookingId,
    {},
  );
  revalidatePath("/admin/classes");
}

export async function stubCancelSessionAction(sessionId: string) {
  const tenantId = await getCurrentTenantId();
  await withTenantScope(tenantId, async (db) => {
    await db
      .update(sessions)
      .set({ status: "cancelled" })
      .where(eq(sessions.id, sessionId));
    await db
      .update(bookings)
      .set({ status: "cancelled", cancelledAt: new Date() })
      .where(
        and(
          eq(bookings.sessionId, sessionId),
          eq(bookings.status, "booked"),
        ),
      );
  });
  await logAudit("session.cancel", "session", sessionId, {});
  revalidatePath("/admin/classes");
  revalidatePath(`/admin/classes/${sessionId}`);
}
