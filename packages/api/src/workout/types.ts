export type ExerciseMetric = "weight_reps" | "reps_only" | "time";

export type SyncStatus = "pending" | "synced" | "failed";

export type WorkoutSetRow = {
  id: string;
  workoutId: string;
  exerciseId: string;
  orderIndex: number;
  setIndex: number;
  weight: number | null;
  reps: number | null;
  durationSec: number | null;
  restSec: number | null;
  isWarmup: boolean;
  isPr: boolean;
  createdAt: string;
};

export type WorkoutRow = {
  id: string;
  tenantId: string;
  memberId: string;
  title: string;
  startedAt: string;
  finishedAt: string | null;
  durationSec: number;
  totalVolume: number;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
};
