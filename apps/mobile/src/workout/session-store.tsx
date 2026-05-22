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
import {
  detectPrSets,
  summariseWorkout,
  type WorkoutSetRow,
} from "@fitness/api";
import { useAuth } from "../lib/store";
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
import type { LocalWorkout, LocalWorkoutSet } from "../db/schema";

const uuid = (): string => Crypto.randomUUID();

const TENANT_ID = process.env.EXPO_PUBLIC_TENANT_ID ?? "";

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
  startWorkout: (sourceWorkoutId?: string) => void;
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
    (sourceWorkoutId?: string) => {
      if (!member?.dbId || !TENANT_ID) return;
      if (getActiveWorkout()) return;
      const id = uuid();
      const row: LocalWorkout = {
        id,
        tenantId: TENANT_ID,
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
      };
      insertWorkout(row);
      if (sourceWorkoutId) {
        for (const s of listSets(sourceWorkoutId)) {
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
      }
      setWorkout(row);
      reload(id);
    },
    [member, reload],
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
    const id = workout.id;
    setWorkout(null);
    setSets([]);
    return id;
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
