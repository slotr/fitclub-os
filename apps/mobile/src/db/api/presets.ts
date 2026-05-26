import { inArray } from "drizzle-orm";
import { getPreset, type PresetProgram } from "@fitness/api";
import { db } from "../client";
import { exercises } from "../schema";
import { createTemplate, type TemplateExerciseInput } from "./templates";
import { createProgram, type ProgramDayInput } from "./programs";

export class PresetExercisesMissingError extends Error {
  constructor(public missing: string[]) {
    super(`preset references missing exercises: ${missing.join(", ")}`);
    this.name = "PresetExercisesMissingError";
  }
}

function checkExerciseSlugs(slugs: string[]): {
  bySlug: Record<string, string>;
  missing: string[];
} {
  const unique = Array.from(new Set(slugs));
  if (unique.length === 0) return { bySlug: {}, missing: [] };
  const rows = db.select({ id: exercises.id, slug: exercises.slug })
    .from(exercises)
    .where(inArray(exercises.slug, unique))
    .all();
  const bySlug: Record<string, string> = {};
  for (const r of rows) {
    if (r.slug) bySlug[r.slug] = r.id;
  }
  const missing = unique.filter((s) => !(s in bySlug));
  return { bySlug, missing };
}

export async function copyPresetToProgram(
  preset: PresetProgram,
  tenantId: string,
  memberId: string,
): Promise<string> {
  const allSlugs: string[] = [];
  for (const d of preset.days) {
    for (const ex of d.exercises) allSlugs.push(ex.exerciseSlug);
  }
  const { bySlug, missing } = checkExerciseSlugs(allSlugs);
  if (missing.length > 0) throw new PresetExercisesMissingError(missing);

  // Group days by title → one template per unique title
  const titleToTemplate: Record<string, string> = {};
  for (const d of preset.days) {
    if (d.isRest) continue;
    if (titleToTemplate[d.title]) continue;
    const tplExercises: TemplateExerciseInput[] = d.exercises.map((ex, i) => ({
      exerciseId: bySlug[ex.exerciseSlug]!,
      position: i,
      sets: ex.sets,
      repMin: ex.repMin,
      repMax: ex.repMax,
      restSeconds: ex.restSeconds,
      targetRpe: ex.targetRpe,
      target1rmPct: ex.target1rmPct,
      tempo: ex.tempo,
      supersetGroup: ex.supersetGroup,
      notes: ex.notes,
    }));
    const tplId = await createTemplate({
      tenantId,
      memberId,
      name: d.title,
      description: null,
      estimatedMin: null,
      exercises: tplExercises,
    });
    titleToTemplate[d.title] = tplId;
  }

  const dayInputs: ProgramDayInput[] = preset.days.map((d) => ({
    week: d.week,
    day: d.day,
    position: (d.week - 1) * preset.daysPerWeek + (d.day - 1),
    title: d.title,
    templateId: d.isRest ? null : titleToTemplate[d.title] ?? null,
    isRest: d.isRest,
    notes: d.notes ?? null,
  }));

  const programId = await createProgram(
    {
      tenantId,
      memberId,
      name: preset.name,
      description: preset.description,
      weeksCount: preset.weeks,
      daysPerWeek: preset.daysPerWeek,
      sourcePreset: preset.slug,
    },
    dayInputs,
  );

  return programId;
}

export function lookupPresetBySlug(slug: string) {
  return getPreset(slug);
}
