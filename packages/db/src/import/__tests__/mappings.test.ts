import { describe, expect, it } from "vitest";
import { mapEquipment, mapMuscle, slugify, transformExercise } from "../mappings";
import type { RawExercise } from "../types";

describe("slugify", () => {
  it("lowercases and turns underscores into dashes", () => {
    expect(slugify("3_4_Sit-Up")).toBe("3-4-sit-up");
  });
  it("strips characters that are not alphanumerics or dashes", () => {
    expect(slugify("Bench Press!")).toBe("bench-press");
  });
  it("collapses repeated dashes and trims edges", () => {
    expect(slugify("__Foo--Bar__")).toBe("foo-bar");
  });
  it("is idempotent", () => {
    const once = slugify("Barbell_Bench_Press_-_Medium_Grip");
    expect(slugify(once)).toBe(once);
  });
});

describe("mapMuscle", () => {
  it("maps a few common dataset muscles", () => {
    expect(mapMuscle("chest")).toBe("chest");
    expect(mapMuscle("quadriceps")).toBe("legs");
    expect(mapMuscle("hamstrings")).toBe("legs");
    expect(mapMuscle("lats")).toBe("back");
    expect(mapMuscle("middle back")).toBe("back");
    expect(mapMuscle("traps")).toBe("back");
    expect(mapMuscle("abdominals")).toBe("core");
    expect(mapMuscle("neck")).toBe("core");
    expect(mapMuscle("forearms")).toBe("biceps");
    expect(mapMuscle("calves")).toBe("legs");
    expect(mapMuscle("glutes")).toBe("glutes");
  });
  it("falls back to fullBody for unknown or empty values", () => {
    expect(mapMuscle("something-strange")).toBe("fullBody");
    expect(mapMuscle("")).toBe("fullBody");
    expect(mapMuscle(undefined)).toBe("fullBody");
  });
});

describe("mapEquipment", () => {
  it("maps the obvious cases", () => {
    expect(mapEquipment("barbell")).toBe("barbell");
    expect(mapEquipment("dumbbell")).toBe("dumbbell");
    expect(mapEquipment("kettlebells")).toBe("kettlebell");
    expect(mapEquipment("cable")).toBe("cable");
    expect(mapEquipment("machine")).toBe("machine");
    expect(mapEquipment("body only")).toBe("bodyweight");
    expect(mapEquipment("bands")).toBe("band");
  });
  it("buckets balls / foam roll / nullish into 'other'", () => {
    expect(mapEquipment("medicine ball")).toBe("other");
    expect(mapEquipment("exercise ball")).toBe("other");
    expect(mapEquipment("foam roll")).toBe("other");
    expect(mapEquipment("other")).toBe("other");
    expect(mapEquipment(null)).toBe("other");
    expect(mapEquipment(undefined)).toBe("other");
  });
});

describe("transformExercise", () => {
  const raw: RawExercise = {
    id: "Barbell_Bench_Press_-_Medium_Grip",
    name: "Barbell Bench Press - Medium Grip",
    force: "push",
    level: "intermediate",
    mechanic: "compound",
    equipment: "barbell",
    primaryMuscles: ["chest"],
    secondaryMuscles: ["triceps", "shoulders"],
    instructions: ["Lie down.", "Lower the bar.", "Press up."],
    category: "strength",
    images: ["Barbell_Bench_Press_-_Medium_Grip/0.jpg"],
  };

  it("maps every field shapeward", () => {
    const out = transformExercise(raw, "https://x.test/storage/v1/object/public/exercise-images/barbell-bench-press-medium-grip.webp");
    expect(out.slug).toBe("barbell-bench-press-medium-grip");
    expect(out.name).toBe("Barbell Bench Press - Medium Grip");
    expect(out.primaryMuscle).toBe("chest");
    expect(out.equipment).toBe("barbell");
    expect(out.metric).toBe("weight_reps");
    expect(out.defaultRestSec).toBe(150); // compound strength
    expect(out.instructions).toBe("Lie down.\n\nLower the bar.\n\nPress up.");
    expect(out.imageUrl).toMatch(/barbell-bench-press-medium-grip\.webp$/);
  });

  it("passes a null imageUrl through when no image was uploaded", () => {
    const out = transformExercise(raw, null);
    expect(out.imageUrl).toBeNull();
  });
});
