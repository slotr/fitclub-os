export type ExerciseMetric = "weight_reps" | "reps_only" | "time";

const HOLD_NAME_REGEX = /plank|hold|wall sit|hollow|dead hang|l[- ]sit|bridge hold/i;

export function deriveMetric(input: {
  category: string | null | undefined;
  equipment: string | null | undefined;
  name: string;
}): ExerciseMetric {
  const { category, equipment, name } = input;
  if (category === "stretching") return "time";
  if (category === "cardio") return "time";
  if (equipment === "body only" && category === "strength") {
    return HOLD_NAME_REGEX.test(name) ? "time" : "reps_only";
  }
  return "weight_reps";
}

export function deriveDefaultRest(input: {
  category: string | null | undefined;
  mechanic: string | null | undefined;
}): number {
  const { category, mechanic } = input;
  if (category === "powerlifting") return 180;
  if (mechanic === "compound") return 150;
  if (mechanic === "isolation") return 90;
  if (category === "cardio" || category === "stretching") return 60;
  return 120;
}
