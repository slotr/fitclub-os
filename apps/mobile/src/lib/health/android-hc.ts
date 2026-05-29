import {
  initialize,
  requestPermission as hcRequestPermission,
  insertRecords,
} from "react-native-health-connect";
import type { HealthWorkoutPayload, HealthResult } from "./types";

const PERMS = [
  { accessType: "write" as const, recordType: "ExerciseSession" as const },
  { accessType: "write" as const, recordType: "ActiveCaloriesBurned" as const },
  { accessType: "read" as const, recordType: "ExerciseSession" as const },
];

export async function isAvailable(): Promise<boolean> {
  try {
    await initialize();
    return true;
  } catch {
    return false;
  }
}

export async function requestPermission(): Promise<boolean> {
  await initialize();
  const granted = await hcRequestPermission(PERMS);
  return granted.length === PERMS.length;
}

export async function writeWorkout(
  payload: HealthWorkoutPayload,
): Promise<HealthResult> {
  try {
    await initialize();
    const records: unknown[] = [
      {
        recordType: "ExerciseSession",
        startTime: payload.startedAt,
        endTime: payload.finishedAt,
        exerciseType: 13, // EXERCISE_TYPE_STRENGTH_TRAINING
        title: "Gym Workout",
        notes: payload.notes ?? undefined,
        metadata: { clientRecordId: payload.workoutId },
      },
    ];
    if (payload.totalEnergyKcal != null) {
      records.push({
        recordType: "ActiveCaloriesBurned",
        startTime: payload.startedAt,
        endTime: payload.finishedAt,
        energy: { value: payload.totalEnergyKcal, unit: "kilocalories" },
      });
    }
    const ids = await insertRecords(records as never);
    return { ok: true, recordId: ids[0] ?? "" };
  } catch (e: any) {
    return { ok: false, error: e?.message ?? String(e) };
  }
}
