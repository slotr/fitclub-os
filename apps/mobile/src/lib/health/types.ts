export type HealthWorkoutPayload = {
  workoutId: string;
  startedAt: string;
  finishedAt: string;
  durationSec: number;
  totalEnergyKcal: number | null;
  exerciseType: "strength_training" | "other";
  notes: string | null;
};

export type HealthResult =
  | { ok: true; recordId: string }
  | { ok: false; error: string };

export type HealthSyncSummary = {
  total: number;
  synced: number;
  failed: number;
};
