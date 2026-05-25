"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, eq, sql } from "drizzle-orm";
import { challenges } from "@fitness/db";
import { challengeInputSchema } from "@fitness/api";
import { logAudit } from "@/lib/audit";
import { withTenantScope } from "@/lib/db";
import { getCurrentTenantId } from "@/lib/tenant";

type FormResult = { ok: true; id: string } | { ok: false; error: string };

function readFormFields(formData: FormData) {
  const exerciseId = String(formData.get("exerciseId") ?? "").trim();
  return {
    name: String(formData.get("name") ?? ""),
    description:
      String(formData.get("description") ?? "").trim() || null,
    metricType: String(formData.get("metricType") ?? ""),
    exerciseId: exerciseId.length > 0 ? exerciseId : null,
    startsAt: String(formData.get("startsAt") ?? ""),
    endsAt: String(formData.get("endsAt") ?? ""),
  };
}

export async function createChallengeAction(
  formData: FormData,
): Promise<FormResult> {
  const tenantId = await getCurrentTenantId();
  if (!tenantId) return { ok: false, error: "no tenant" };
  const parsed = challengeInputSchema.safeParse(readFormFields(formData));
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "invalid",
    };
  }
  const publish = formData.get("publish") === "1";

  const id = await withTenantScope(tenantId, async (db) => {
    const [row] = await db
      .insert(challenges)
      .values({
        tenantId,
        name: parsed.data.name,
        description: parsed.data.description ?? null,
        metricType: parsed.data.metricType,
        exerciseId: parsed.data.exerciseId ?? null,
        startsAt: new Date(parsed.data.startsAt),
        endsAt: new Date(parsed.data.endsAt),
        status: publish ? "active" : "draft",
      })
      .returning({ id: challenges.id });
    return row!.id;
  });

  await logAudit("challenge.create", "challenge", id, {
    name: parsed.data.name,
    metricType: parsed.data.metricType,
    status: publish ? "active" : "draft",
  });
  revalidatePath("/admin/challenges");
  redirect(`/admin/challenges/${id}` as Parameters<typeof redirect>[0]);
}

export async function updateChallengeAction(
  id: string,
  formData: FormData,
): Promise<FormResult> {
  const tenantId = await getCurrentTenantId();
  if (!tenantId) return { ok: false, error: "no tenant" };

  const existing = await withTenantScope(tenantId, async (db) => {
    const [row] = await db
      .select()
      .from(challenges)
      .where(
        and(eq(challenges.id, id), eq(challenges.tenantId, tenantId)),
      );
    return row;
  });
  if (!existing) return { ok: false, error: "not found" };

  const fields = readFormFields(formData);
  const isDraft = existing.status === "draft";
  const safeFields = isDraft
    ? fields
    : {
        ...fields,
        metricType: existing.metricType,
        exerciseId: existing.exerciseId,
        startsAt: existing.startsAt.toISOString(),
        endsAt: existing.endsAt.toISOString(),
      };
  const parsed = challengeInputSchema.safeParse(safeFields);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "invalid",
    };
  }

  await withTenantScope(tenantId, async (db) => {
    await db
      .update(challenges)
      .set({
        name: parsed.data.name,
        description: parsed.data.description ?? null,
        metricType: parsed.data.metricType,
        exerciseId: parsed.data.exerciseId ?? null,
        startsAt: new Date(parsed.data.startsAt),
        endsAt: new Date(parsed.data.endsAt),
        updatedAt: sql`now()`,
      })
      .where(
        and(eq(challenges.id, id), eq(challenges.tenantId, tenantId)),
      );
  });

  await logAudit("challenge.update", "challenge", id, {
    name: parsed.data.name,
  });
  revalidatePath("/admin/challenges");
  revalidatePath(`/admin/challenges/${id}`);
  return { ok: true, id };
}

async function setStatus(
  id: string,
  next: "active" | "ended" | "cancelled",
  auditAction: "challenge.publish" | "challenge.end" | "challenge.cancel",
): Promise<FormResult> {
  const tenantId = await getCurrentTenantId();
  if (!tenantId) return { ok: false, error: "no tenant" };
  await withTenantScope(tenantId, async (db) => {
    await db
      .update(challenges)
      .set({ status: next, updatedAt: sql`now()` })
      .where(
        and(eq(challenges.id, id), eq(challenges.tenantId, tenantId)),
      );
  });
  await logAudit(auditAction, "challenge", id, { status: next });
  revalidatePath("/admin/challenges");
  revalidatePath(`/admin/challenges/${id}`);
  return { ok: true, id };
}

export async function publishChallengeAction(id: string) {
  return setStatus(id, "active", "challenge.publish");
}

export async function endChallengeAction(id: string) {
  return setStatus(id, "ended", "challenge.end");
}
