import { Platform } from "react-native";
import * as iosHealth from "./ios-healthkit";
import * as androidHealth from "./android-hc";
import type { HealthWorkoutPayload, HealthResult } from "./types";

export type { HealthWorkoutPayload, HealthResult, HealthSyncSummary } from "./types";

export async function isHealthAvailable(): Promise<boolean> {
  if (Platform.OS === "ios") return iosHealth.isAvailable();
  if (Platform.OS === "android") return androidHealth.isAvailable();
  return false;
}

export async function requestHealthPermission(): Promise<boolean> {
  if (Platform.OS === "ios") return iosHealth.requestPermission();
  if (Platform.OS === "android") return androidHealth.requestPermission();
  return false;
}

export async function writeWorkoutToHealth(
  payload: HealthWorkoutPayload,
): Promise<HealthResult> {
  if (Platform.OS === "ios") return iosHealth.writeWorkout(payload);
  if (Platform.OS === "android") return androidHealth.writeWorkout(payload);
  return { ok: false, error: "Unsupported platform" };
}
