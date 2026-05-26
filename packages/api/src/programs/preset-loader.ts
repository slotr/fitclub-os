import { presetProgramSchema, type PresetProgram } from "./preset-schema";

// JSON imports are added in Task 3 (presets 1-5) and Task 4 (presets 6-10).
const RAW: unknown[] = [];

export const PRESETS: PresetProgram[] = RAW.map((p) => presetProgramSchema.parse(p));
export const PRESETS_BY_SLUG: Record<string, PresetProgram> = Object.fromEntries(
  PRESETS.map((p) => [p.slug, p]),
);

export function getPreset(slug: string): PresetProgram | undefined {
  return PRESETS_BY_SLUG[slug];
}
