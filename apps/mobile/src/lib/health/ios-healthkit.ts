import AppleHealthKit from "react-native-health";
import type { HealthWorkoutPayload, HealthResult } from "./types";

const PERMS = {
  permissions: {
    read: ["Workout"] as never,
    write: ["Workout", "ActiveEnergyBurned"] as never,
  },
} as const;

export function isAvailable(): Promise<boolean> {
  return new Promise((resolve) => {
    AppleHealthKit.isAvailable((err, available) => {
      resolve(!err && available);
    });
  });
}

export function requestPermission(): Promise<boolean> {
  return new Promise((resolve) => {
    AppleHealthKit.initHealthKit(PERMS as never, (err) => {
      resolve(!err);
    });
  });
}

export async function writeWorkout(
  payload: HealthWorkoutPayload,
): Promise<HealthResult> {
  return new Promise((resolve) => {
    AppleHealthKit.saveWorkout(
      {
        type: "FunctionalStrengthTraining",
        startDate: payload.startedAt,
        endDate: payload.finishedAt,
        energyBurned: payload.totalEnergyKcal ?? undefined,
        distance: 0,
        metadata: {
          HKExternalUUID: payload.workoutId,
          HKWorkoutBrandName: "FitClub",
          Notes: payload.notes ?? "",
        },
      } as never,
      (err: unknown, result: unknown) => {
        if (err) resolve({ ok: false, error: String(err) });
        else resolve({ ok: true, recordId: String(result) });
      },
    );
  });
}
