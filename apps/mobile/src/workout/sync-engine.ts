import { eq, inArray } from "drizzle-orm";
import { selectPending } from "@fitness/api";
import { getSupabase } from "../lib/supabase";
import { db } from "../db/client";
import {
  exercises,
  memberExercisePrefs,
  workouts,
  workoutSets,
  workoutTemplates,
  workoutTemplateExercises,
  programs,
  programDays,
  programDayCompletions,
} from "../db/schema";
import { upsertExercise } from "../db/repo";
import type { LocalExercise } from "../db/schema";

let lastPullAt = "1970-01-01T00:00:00Z";
let lastPullTemplatesAt = "1970-01-01T00:00:00Z";
let lastPullProgramsAt = "1970-01-01T00:00:00Z";
let lastPullCompletionsAt = "1970-01-01T00:00:00Z";

/** Pull the global exercise library + own custom exercises into SQLite. */
async function pullLibrary(memberId: string): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) return;
  const { data, error } = await supabase
    .from("exercises")
    .select("*")
    .gt("updated_at", lastPullAt);
  if (error || !data) return;
  for (const e of data as Record<string, unknown>[]) {
    const row: LocalExercise = {
      id: String(e.id),
      tenantId: (e.tenant_id as string) ?? null,
      memberId: (e.member_id as string) ?? null,
      slug: (e.slug as string) ?? null,
      name: String(e.name),
      primaryMuscle: String(e.primary_muscle),
      equipment: String(e.equipment),
      metric: String(e.metric),
      defaultRestSec: Number(e.default_rest_sec ?? 90),
      instructions: (e.instructions as string) ?? null,
      imageUrl: (e.image_url as string) ?? null,
      createdAt: String(e.created_at),
      updatedAt: String(e.updated_at),
      deletedAt: (e.deleted_at as string) ?? null,
      syncStatus: "synced",
      syncedAt: new Date().toISOString(),
    };
    upsertExercise(row);
  }
  lastPullAt = new Date().toISOString();
}

/** Pull workout templates (+ their exercises) for this member. */
async function pullTemplates(memberId: string): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) return;
  const { data, error } = await supabase
    .from("workout_templates")
    .select("*")
    .eq("member_id", memberId)
    .gt("updated_at", lastPullTemplatesAt);
  if (error || !data) return;
  for (const r of data as Record<string, unknown>[]) {
    db.insert(workoutTemplates).values({
      id: String(r.id),
      tenantId: String(r.tenant_id),
      memberId: String(r.member_id),
      name: String(r.name),
      description: (r.description as string) ?? null,
      estimatedMin: (r.estimated_min as number) ?? null,
      sourcePreset: (r.source_preset as string) ?? null,
      createdAt: String(r.created_at),
      updatedAt: String(r.updated_at),
      deletedAt: (r.deleted_at as string) ?? null,
      syncStatus: "synced",
      syncedAt: new Date().toISOString(),
    }).onConflictDoUpdate({
      target: workoutTemplates.id,
      set: {
        name: String(r.name),
        description: (r.description as string) ?? null,
        estimatedMin: (r.estimated_min as number) ?? null,
        sourcePreset: (r.source_preset as string) ?? null,
        updatedAt: String(r.updated_at),
        deletedAt: (r.deleted_at as string) ?? null,
        syncStatus: "synced",
        syncedAt: new Date().toISOString(),
      },
    }).run();
  }

  if (data.length > 0) {
    const tplIds = data.map((r) => String(r.id));
    const { data: exData, error: exErr } = await supabase
      .from("workout_template_exercises")
      .select("*")
      .in("template_id", tplIds);
    if (!exErr && exData) {
      for (const r of exData as Record<string, unknown>[]) {
        db.insert(workoutTemplateExercises).values({
          id: String(r.id),
          templateId: String(r.template_id),
          exerciseId: String(r.exercise_id),
          position: Number(r.position),
          sets: Number(r.sets),
          repMin: (r.rep_min as number) ?? null,
          repMax: (r.rep_max as number) ?? null,
          restSeconds: (r.rest_seconds as number) ?? null,
          targetRpe: (r.target_rpe as number) ?? null,
          target1rmPct: (r.target_1rm_pct as number) ?? null,
          tempo: (r.tempo as string) ?? null,
          supersetGroup: (r.superset_group as number) ?? null,
          notes: (r.notes as string) ?? null,
          syncStatus: "synced",
        }).onConflictDoUpdate({
          target: workoutTemplateExercises.id,
          set: {
            sets: Number(r.sets),
            repMin: (r.rep_min as number) ?? null,
            repMax: (r.rep_max as number) ?? null,
            restSeconds: (r.rest_seconds as number) ?? null,
            syncStatus: "synced",
          },
        }).run();
      }
    }
  }

  lastPullTemplatesAt = new Date().toISOString();
}

/** Pull programs (+ their days) for this member. */
async function pullPrograms(memberId: string): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) return;
  const { data, error } = await supabase
    .from("programs")
    .select("*")
    .eq("member_id", memberId)
    .gt("updated_at", lastPullProgramsAt);
  if (error || !data) return;
  for (const r of data as Record<string, unknown>[]) {
    db.insert(programs).values({
      id: String(r.id),
      tenantId: String(r.tenant_id),
      memberId: String(r.member_id),
      name: String(r.name),
      description: (r.description as string) ?? null,
      weeksCount: Number(r.weeks_count),
      daysPerWeek: Number(r.days_per_week),
      status: String(r.status),
      currentPosition: Number(r.current_position),
      sourcePreset: (r.source_preset as string) ?? null,
      startedAt: (r.started_at as string) ?? null,
      completedAt: (r.completed_at as string) ?? null,
      createdAt: String(r.created_at),
      updatedAt: String(r.updated_at),
      deletedAt: (r.deleted_at as string) ?? null,
      syncStatus: "synced",
      syncedAt: new Date().toISOString(),
    }).onConflictDoUpdate({
      target: programs.id,
      set: {
        status: String(r.status),
        currentPosition: Number(r.current_position),
        startedAt: (r.started_at as string) ?? null,
        completedAt: (r.completed_at as string) ?? null,
        updatedAt: String(r.updated_at),
        syncStatus: "synced",
        syncedAt: new Date().toISOString(),
      },
    }).run();
  }

  if (data.length > 0) {
    const programIds = data.map((r) => String(r.id));
    const { data: dayData, error: dayErr } = await supabase
      .from("program_days")
      .select("*")
      .in("program_id", programIds);
    if (!dayErr && dayData) {
      for (const r of dayData as Record<string, unknown>[]) {
        db.insert(programDays).values({
          id: String(r.id),
          programId: String(r.program_id),
          week: Number(r.week),
          day: Number(r.day),
          position: Number(r.position),
          title: String(r.title),
          templateId: (r.template_id as string) ?? null,
          isRest: r.is_rest ? 1 : 0,
          notes: (r.notes as string) ?? null,
          syncStatus: "synced",
        }).onConflictDoUpdate({
          target: programDays.id,
          set: {
            title: String(r.title),
            templateId: (r.template_id as string) ?? null,
            isRest: r.is_rest ? 1 : 0,
            syncStatus: "synced",
          },
        }).run();
      }
    }
  }
  lastPullProgramsAt = new Date().toISOString();
}

/** Pull program day completions for this member (incremental by completed_at). */
async function pullCompletions(memberId: string): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) return;
  const { data, error } = await supabase
    .from("program_day_completions")
    .select("*")
    .eq("member_id", memberId)
    .gt("completed_at", lastPullCompletionsAt);
  if (error || !data) return;
  for (const r of data as Record<string, unknown>[]) {
    db.insert(programDayCompletions).values({
      id: String(r.id),
      programId: String(r.program_id),
      programDayId: String(r.program_day_id),
      memberId: String(r.member_id),
      workoutId: (r.workout_id as string) ?? null,
      completedAt: String(r.completed_at),
      syncStatus: "synced",
    }).onConflictDoNothing().run();
  }
  lastPullCompletionsAt = new Date().toISOString();
}

/** Push pending workouts + their sets to Supabase. */
async function pushWorkouts(): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) return;
  const pending = selectPending(db.select().from(workouts).all());
  for (const w of pending) {
    const setRows = db
      .select()
      .from(workoutSets)
      .where(eq(workoutSets.workoutId, w.id))
      .all();
    const { error: wErr } = await supabase.from("workouts").upsert({
      id: w.id,
      tenant_id: w.tenantId,
      member_id: w.memberId,
      title: w.title,
      started_at: w.startedAt,
      finished_at: w.finishedAt,
      duration_sec: w.durationSec,
      total_volume: w.totalVolume,
      notes: w.notes,
      updated_at: w.updatedAt,
      deleted_at: w.deletedAt,
    });
    let ok = !wErr;
    if (ok && setRows.length > 0) {
      const { error: sErr } = await supabase.from("workout_sets").upsert(
        setRows.map((s) => ({
          id: s.id,
          workout_id: s.workoutId,
          exercise_id: s.exerciseId,
          order_index: s.orderIndex,
          set_index: s.setIndex,
          weight: s.weight,
          reps: s.reps,
          duration_sec: s.durationSec,
          rest_sec: s.restSec,
          is_warmup: s.isWarmup === 1,
          is_pr: s.isPr === 1,
        })),
      );
      ok = !sErr;
    }
    db.update(workouts)
      .set({ syncStatus: ok ? "synced" : "failed" })
      .where(eq(workouts.id, w.id))
      .run();
  }
}

/** Push pending custom exercises + prefs. */
async function pushCustom(): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) return;
  const pendingEx = db
    .select()
    .from(exercises)
    .where(eq(exercises.syncStatus, "pending"))
    .all();
  for (const e of pendingEx) {
    const { error } = await supabase.from("exercises").upsert({
      id: e.id,
      tenant_id: e.tenantId,
      member_id: e.memberId,
      name: e.name,
      primary_muscle: e.primaryMuscle,
      equipment: e.equipment,
      metric: e.metric,
      default_rest_sec: e.defaultRestSec,
      updated_at: e.updatedAt,
      deleted_at: e.deletedAt,
    });
    db.update(exercises)
      .set({ syncStatus: error ? "failed" : "synced" })
      .where(eq(exercises.id, e.id))
      .run();
  }
  const pendingPrefs = db
    .select()
    .from(memberExercisePrefs)
    .where(eq(memberExercisePrefs.syncStatus, "pending"))
    .all();
  for (const p of pendingPrefs) {
    const { error } = await supabase.from("member_exercise_prefs").upsert({
      id: p.id,
      tenant_id: p.tenantId,
      member_id: p.memberId,
      exercise_id: p.exerciseId,
      default_rest_sec: p.defaultRestSec,
      updated_at: p.updatedAt,
    });
    db.update(memberExercisePrefs)
      .set({ syncStatus: error ? "failed" : "synced" })
      .where(eq(memberExercisePrefs.id, p.id))
      .run();
  }
}

/** Push pending workout templates to Supabase. */
async function pushTemplates(): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) return;
  const pending = db.select().from(workoutTemplates)
    .where(inArray(workoutTemplates.syncStatus, ["pending", "failed"])).all();
  for (const t of pending) {
    const { error } = await supabase.from("workout_templates").upsert({
      id: t.id,
      tenant_id: t.tenantId,
      member_id: t.memberId,
      name: t.name,
      description: t.description,
      estimated_min: t.estimatedMin,
      source_preset: t.sourcePreset,
      created_at: t.createdAt,
      updated_at: t.updatedAt,
      deleted_at: t.deletedAt,
    });
    if (!error) {
      db.update(workoutTemplates)
        .set({ syncStatus: "synced", syncedAt: new Date().toISOString() })
        .where(eq(workoutTemplates.id, t.id))
        .run();
    }
  }
}

/** Push pending workout template exercises to Supabase. */
async function pushTemplateExercises(): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) return;
  const pending = db.select().from(workoutTemplateExercises)
    .where(inArray(workoutTemplateExercises.syncStatus, ["pending", "failed"])).all();
  for (const x of pending) {
    const { error } = await supabase.from("workout_template_exercises").upsert({
      id: x.id,
      template_id: x.templateId,
      exercise_id: x.exerciseId,
      position: x.position,
      sets: x.sets,
      rep_min: x.repMin,
      rep_max: x.repMax,
      rest_seconds: x.restSeconds,
      target_rpe: x.targetRpe,
      target_1rm_pct: x.target1rmPct,
      tempo: x.tempo,
      superset_group: x.supersetGroup,
      notes: x.notes,
    });
    if (!error) {
      db.update(workoutTemplateExercises)
        .set({ syncStatus: "synced" })
        .where(eq(workoutTemplateExercises.id, x.id))
        .run();
    }
  }
}

/** Push pending programs to Supabase. */
async function pushPrograms(): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) return;
  const pending = db.select().from(programs)
    .where(inArray(programs.syncStatus, ["pending", "failed"])).all();
  for (const p of pending) {
    const { error } = await supabase.from("programs").upsert({
      id: p.id,
      tenant_id: p.tenantId,
      member_id: p.memberId,
      name: p.name,
      description: p.description,
      weeks_count: p.weeksCount,
      days_per_week: p.daysPerWeek,
      status: p.status,
      current_position: p.currentPosition,
      source_preset: p.sourcePreset,
      started_at: p.startedAt,
      completed_at: p.completedAt,
      created_at: p.createdAt,
      updated_at: p.updatedAt,
      deleted_at: p.deletedAt,
    });
    if (!error) {
      db.update(programs)
        .set({ syncStatus: "synced", syncedAt: new Date().toISOString() })
        .where(eq(programs.id, p.id))
        .run();
    }
  }
}

/** Push pending program days to Supabase. */
async function pushProgramDays(): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) return;
  const pending = db.select().from(programDays)
    .where(inArray(programDays.syncStatus, ["pending", "failed"])).all();
  for (const d of pending) {
    const { error } = await supabase.from("program_days").upsert({
      id: d.id,
      program_id: d.programId,
      week: d.week,
      day: d.day,
      position: d.position,
      title: d.title,
      template_id: d.templateId,
      is_rest: d.isRest === 1,
      notes: d.notes,
    });
    if (!error) {
      db.update(programDays)
        .set({ syncStatus: "synced" })
        .where(eq(programDays.id, d.id))
        .run();
    }
  }
}

/** Push pending program day completions to Supabase. */
async function pushCompletions(): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) return;
  const pending = db.select().from(programDayCompletions)
    .where(inArray(programDayCompletions.syncStatus, ["pending", "failed"])).all();
  for (const c of pending) {
    const { error } = await supabase.from("program_day_completions").upsert({
      id: c.id,
      program_id: c.programId,
      program_day_id: c.programDayId,
      member_id: c.memberId,
      workout_id: c.workoutId,
      completed_at: c.completedAt,
    });
    if (!error) {
      db.update(programDayCompletions)
        .set({ syncStatus: "synced" })
        .where(eq(programDayCompletions.id, c.id))
        .run();
    }
  }
}

/** Count of rows still waiting to sync. */
export function pendingCount(): number {
  return selectPending(db.select().from(workouts).all()).length;
}

/** Full sync pass. Safe to call repeatedly; all writes are idempotent. */
export async function runSync(memberId: string): Promise<void> {
  try {
    // Pulls (independent — run sequentially to keep cursor updates clean)
    await pullLibrary(memberId);
    await pullTemplates(memberId);
    await pullPrograms(memberId);
    await pullCompletions(memberId);
    // Pushes (FK-ordered: templates -> template_exercises -> programs ->
    //         program_days -> workouts -> completions)
    await pushCustom();
    await pushTemplates();
    await pushTemplateExercises();
    await pushPrograms();
    await pushProgramDays();
    await pushWorkouts();
    await pushCompletions();
  } catch {
    // Local-first: a failed sync never surfaces an error to the UI.
  }
}
