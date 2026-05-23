import { deriveDefaultRest, deriveMetric } from "./heuristics";
import type { MappedExercise, RawExercise } from "./types";

export type MuscleEnum =
  | "chest" | "back" | "shoulders" | "biceps" | "triceps"
  | "legs" | "glutes" | "core" | "fullBody";

export type EquipmentEnum =
  | "barbell" | "dumbbell" | "machine" | "cable"
  | "bodyweight" | "kettlebell" | "band" | "other";

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/_/g, "-")
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

const MUSCLE_MAP: Record<string, MuscleEnum> = {
  chest: "chest",
  lats: "back",
  "middle back": "back",
  "lower back": "back",
  traps: "back",
  shoulders: "shoulders",
  biceps: "biceps",
  forearms: "biceps",
  triceps: "triceps",
  quadriceps: "legs",
  hamstrings: "legs",
  calves: "legs",
  adductors: "legs",
  abductors: "legs",
  glutes: "glutes",
  abdominals: "core",
  neck: "core",
};

export function mapMuscle(raw: string | null | undefined): MuscleEnum {
  if (!raw) return "fullBody";
  return MUSCLE_MAP[raw] ?? "fullBody";
}

const EQUIPMENT_MAP: Record<string, EquipmentEnum> = {
  barbell: "barbell",
  dumbbell: "dumbbell",
  kettlebells: "kettlebell",
  cable: "cable",
  machine: "machine",
  "body only": "bodyweight",
  bands: "band",
};

export function mapEquipment(
  raw: string | null | undefined,
): EquipmentEnum {
  if (!raw) return "other";
  return EQUIPMENT_MAP[raw] ?? "other";
}

export function transformExercise(
  raw: RawExercise,
  imageUrl: string | null,
): MappedExercise {
  return {
    slug: slugify(raw.id),
    name: raw.name,
    primaryMuscle: mapMuscle(raw.primaryMuscles?.[0]),
    equipment: mapEquipment(raw.equipment),
    metric: deriveMetric({
      category: raw.category,
      equipment: raw.equipment,
      name: raw.name,
    }),
    defaultRestSec: deriveDefaultRest({
      category: raw.category,
      mechanic: raw.mechanic,
    }),
    instructions: (raw.instructions ?? []).join("\n\n"),
    imageUrl,
  };
}
