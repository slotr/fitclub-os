import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import * as Crypto from "expo-crypto";
import { eq } from "drizzle-orm";
import {
  detectPrSets,
  summariseWorkout,
  type WorkoutSetRow,
} from "@fitness/api";
import { useAuth } from "../lib/store";
import { useTenantStore } from "../lib/tenant-store";
import { attemptHealthWriteAsync } from "../lib/health/sync";
import {
  deleteWorkout,
  getActiveWorkout,
  getExercise,
  getPref,
  insertWorkout,
  listAllSetsForMember,
  listSets,
  now,
  updateWorkout,
  upsertSet,
  deleteSet as repoDeleteSet,
} from "../db/repo";
import { db } from "../db/client";
import type { LocalWorkout, LocalWorkoutSet } from "../db/schema";
import {
  workouts as workoutsTable,
  workoutTemplates,
  workoutTemplateExercises,
  programs as programsTable,
  programDays,
  programDayCompletions,
} from "../db/schema";

export type StartOptions = {
  sourceWorkoutId?: string;
  templateId?: string;
  programDayId?: string;
};

const uuid = (): string => Crypto.randomUUID();

function toRow(s: LocalWorkoutSet): WorkoutSetRow {
  return {
    id: s.id,
    workoutId: s.workoutId,
    exerciseId: s.exerciseId,
    orderIndex: s.orderIndex,
    setIndex: s.setIndex,
    weight: s.weight,
    reps: s.reps,
    durationSec: s.durationSec,
    restSec: s.restSec,
    isWarmup: s.isWarmup === 1,
    isPr: s.isPr === 1,
    createdAt: s.createdAt,
  };
}

type Ctx = {
  workout: LocalWorkout | null;
  sets: LocalWorkoutSet[];
  startWorkout: (opts?: StartOptions) => void;
  addExercise: (exerciseId: string) => void;
  addSet: (exerciseId: string) => void;
  updateSet: (id: string, patch: Partial<LocalWorkoutSet>) => void;
  removeSet: (id: string) => void;
  finishWorkout: () => string | null;
  discardWorkout: () => void;
};

const WorkoutSessionContext = createContext<Ctx | null>(null);

export function WorkoutSessionProvider({
  children,
}: {
  children: ReactNode;
}) {
  const { member } = useAuth();
  const tenantId = useTenantStore((s) => s.currentTenantId) ?? "";
  const [workout, setWorkout] = useState<LocalWorkout | null>(null);
  const [sets, setSets] = useState<LocalWorkoutSet[]>([]);

  const reload = useCallback((id: string) => {
    setSets(listSets(id));
  }, []);

  useEffect(() => {
    const active = getActiveWorkout();
    if (active) {
      setWorkout(active);
      setSets(listSets(active.id));
    }
  }, []);

  const startWorkout = useCallback(
    (opts?: StartOptions) => {
      if (!member?.dbId || !tenantId) return;
      if (getActiveWorkout()) return;
      const id = uuid();

      if (opts?.sourceWorkoutId) {
        // --- copy from past workout ---
        const row: LocalWorkout = {
          id,
          tenantId,
          memberId: member.dbId,
          title: "Workout",
          startedAt: now(),
          finishedAt: null,
          durationSec: 0,
          totalVolume: 0,
          notes: null,
          createdAt: now(),
          updatedAt: now(),
          deletedAt: null,
          syncStatus: "pending",
          isActive: 1,
          templateId: null,
          programDayId: null,
          healthSynced: 0,
          healthUuid: null,
          healthAttempts: 0,
        };
        insertWorkout(row);
        for (const s of listSets(opts.sourceWorkoutId)) {
          upsertSet({
            ...s,
            id: uuid(),
            workoutId: id,
            reps: s.reps,
            weight: s.weight,
            isPr: 0,
            createdAt: now(),
          });
        }
        setWorkout(row);
        reload(id);
        return;
      }

      if (opts?.templateId || opts?.programDayId) {
        // --- prefill from template / program day ---
        let resolvedTemplateId: string | null = opts.templateId ?? null;
        let title = "Workout";

        if (opts.programDayId) {
          const programDay = db
            .select()
            .from(programDays)
            .where(eq(programDays.id, opts.programDayId))
            .all()[0] ?? null;
          if (programDay) {
            resolvedTemplateId = programDay.templateId ?? resolvedTemplateId;
            title = programDay.title;
          }
        } else if (resolvedTemplateId) {
          const tmpl = db
            .select()
            .from(workoutTemplates)
            .where(eq(workoutTemplates.id, resolvedTemplateId))
            .all()[0] ?? null;
          if (tmpl) title = tmpl.name;
        }

        const row: LocalWorkout = {
          id,
          tenantId,
          memberId: member.dbId,
          title,
          startedAt: now(),
          finishedAt: null,
          durationSec: 0,
          totalVolume: 0,
          notes: null,
          createdAt: now(),
          updatedAt: now(),
          deletedAt: null,
          syncStatus: "pending",
          isActive: 1,
          templateId: resolvedTemplateId,
          programDayId: opts.programDayId ?? null,
          healthSynced: 0,
          healthUuid: null,
          healthAttempts: 0,
        };
        insertWorkout(row);

        if (resolvedTemplateId) {
          const exercises = db
            .select()
            .from(workoutTemplateExercises)
            .where(eq(workoutTemplateExercises.templateId, resolvedTemplateId))
            .all()
            .sort((a, b) => a.position - b.position);

          for (const ex of exercises) {
            const ex_ = ex;
            const setCount = ex_.sets;
            for (let i = 0; i < setCount; i++) {
              const setRow: LocalWorkoutSet = {
                id: uuid(),
                workoutId: id,
                exerciseId: ex_.exerciseId,
                orderIndex: ex_.position,
                setIndex: i,
                weight: null,
                reps: null,
                durationSec: null,
                restSec: ex_.restSeconds ?? 90,
                isWarmup: 0,
                isPr: 0,
                createdAt: now(),
                plannedRepMin: ex_.repMin ?? null,
                plannedRepMax: ex_.repMax ?? null,
                plannedRestSec: ex_.restSeconds ?? null,
                plannedRpe: ex_.targetRpe ?? null,
                planned1rmPct: ex_.target1rmPct ?? null,
                supersetGroup: ex_.supersetGroup ?? null,
                isComplete: 0,
              };
              upsertSet(setRow);
            }
          }
        }

        setWorkout(row);
        reload(id);
        return;
      }

      // --- default empty workout ---
      const row: LocalWorkout = {
        id,
        tenantId,
        memberId: member.dbId,
        title: "Workout",
        startedAt: now(),
        finishedAt: null,
        durationSec: 0,
        totalVolume: 0,
        notes: null,
        createdAt: now(),
        updatedAt: now(),
        deletedAt: null,
        syncStatus: "pending",
        isActive: 1,
        templateId: null,
        programDayId: null,
        healthSynced: 0,
        healthUuid: null,
        healthAttempts: 0,
      };
      insertWorkout(row);
      setWorkout(row);
      reload(id);
    },
    [member, tenantId, reload],
  );

  const addSet = useCallback(
    (exerciseId: string) => {
      if (!workout) return;
      const existing = sets.filter((s) => s.exerciseId === exerciseId);
      const orderIndex =
        existing[0]?.orderIndex ??
        new Set(sets.map((s) => s.orderIndex)).size;
      const ex = getExercise(exerciseId);
      const restSec =
        getPref(workout.memberId, exerciseId) ??
        ex?.defaultRestSec ??
        90;
      const row: LocalWorkoutSet = {
        id: uuid(),
        workoutId: workout.id,
        exerciseId,
        orderIndex,
        setIndex: existing.length,
        weight: existing[existing.length - 1]?.weight ?? null,
        reps: null,
        durationSec: null,
        restSec,
        isWarmup: 0,
        isPr: 0,
        createdAt: now(),
        plannedRepMin: null,
        plannedRepMax: null,
        plannedRestSec: null,
        plannedRpe: null,
        planned1rmPct: null,
        supersetGroup: null,
        isComplete: 0,
      };
      upsertSet(row);
      reload(workout.id);
    },
    [workout, sets, reload],
  );

  const addExercise = addSet;

  const updateSet = useCallback(
    (id: string, patch: Partial<LocalWorkoutSet>) => {
      const current = sets.find((s) => s.id === id);
      if (!current || !workout) return;
      upsertSet({ ...current, ...patch });
      reload(workout.id);
    },
    [sets, workout, reload],
  );

  const removeSet = useCallback(
    (id: string) => {
      if (!workout) return;
      repoDeleteSet(id);
      reload(workout.id);
    },
    [workout, reload],
  );

  const finishWorkout = useCallback((): string | null => {
    if (!workout) return null;
    const finishedAt = now();
    const setRows = listSets(workout.id).map(toRow);
    const history = listAllSetsForMember(workout.memberId)
      .filter((s) => s.workoutId !== workout.id)
      .map(toRow);
    const summary = summariseWorkout(
      workout.startedAt,
      finishedAt,
      setRows,
    );
    const prIds = new Set(detectPrSets(setRows, history));
    for (const s of setRows) {
      if (prIds.has(s.id)) {
        upsertSet({
          ...listSets(workout.id).find((x) => x.id === s.id)!,
          isPr: 1,
        });
      }
    }
    updateWorkout(workout.id, {
      finishedAt,
      durationSec: summary.durationSec,
      totalVolume: summary.totalVolume,
      isActive: 0,
      syncStatus: "pending",
    });
    const workoutId = workout.id;
    setWorkout(null);
    setSets([]);

    // Train-B: program completion handling
    const finishedRow = db.select().from(workoutsTable)
      .where(eq(workoutsTable.id, workoutId)).all()[0] ?? null;
    if (finishedRow?.programDayId && finishedRow?.memberId) {
      const programDay = db.select()
        .from(programDays)
        .where(eq(programDays.id, finishedRow.programDayId))
        .all()[0] ?? null;
      if (programDay) {
        const completedAt = new Date().toISOString();
        db.insert(programDayCompletions).values({
          id: uuid(),
          programId: programDay.programId,
          programDayId: programDay.id,
          memberId: finishedRow.memberId,
          workoutId,
          completedAt,
          syncStatus: "pending",
        }).onConflictDoNothing().run();
        const prog = db.select()
          .from(programsTable)
          .where(eq(programsTable.id, programDay.programId))
          .all()[0] ?? null;
        if (prog) {
          const total = prog.weeksCount * prog.daysPerWeek;
          const next = Math.min(prog.currentPosition + 1, total);
          const newStatus: "active" | "completed" = next >= total ? "completed" : (prog.status as "active");
          db.update(programsTable).set({
            currentPosition: next,
            status: newStatus,
            completedAt: newStatus === "completed" ? completedAt : prog.completedAt,
            updatedAt: completedAt,
            syncStatus: "pending",
          }).where(eq(programsTable.id, prog.id)).run();
        }
      }
    }

    // Push to Apple Health / Health Connect if user opted in (fire-and-forget)
    void attemptHealthWriteAsync(workoutId);

    return workoutId;
  }, [workout]);

  const discardWorkout = useCallback(() => {
    if (!workout) return;
    deleteWorkout(workout.id);
    setWorkout(null);
    setSets([]);
  }, [workout]);

  const value = useMemo<Ctx>(
    () => ({
      workout,
      sets,
      startWorkout,
      addExercise,
      addSet,
      updateSet,
      removeSet,
      finishWorkout,
      discardWorkout,
    }),
    [
      workout, sets, startWorkout, addExercise, addSet,
      updateSet, removeSet, finishWorkout, discardWorkout,
    ],
  );

  return (
    <WorkoutSessionContext.Provider value={value}>
      {children}
    </WorkoutSessionContext.Provider>
  );
}

export function useWorkoutSession(): Ctx {
  const ctx = useContext(WorkoutSessionContext);
  if (!ctx) {
    throw new Error(
      "useWorkoutSession must be used inside <WorkoutSessionProvider>",
    );
  }
  return ctx;
}
