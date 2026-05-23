/** Shape of an exercise as it appears in free-exercise-db's dist/exercises.json. */
export type RawExercise = {
  id: string;
  name: string;
  force: string | null;
  level: string;
  mechanic: string | null;
  equipment: string | null;
  primaryMuscles: string[];
  secondaryMuscles: string[];
  instructions: string[];
  category: string;
  images: string[];
};

/** Shape we will upsert into the `exercises` table. */
export type MappedExercise = {
  slug: string;
  name: string;
  primaryMuscle:
    | "chest" | "back" | "shoulders" | "biceps" | "triceps"
    | "legs" | "glutes" | "core" | "fullBody";
  equipment:
    | "barbell" | "dumbbell" | "machine" | "cable"
    | "bodyweight" | "kettlebell" | "band" | "other";
  metric: "weight_reps" | "reps_only" | "time";
  defaultRestSec: number;
  instructions: string;
  imageUrl: string | null;
};
