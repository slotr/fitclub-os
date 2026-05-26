import { presetProgramSchema, type PresetProgram } from "./preset-schema";

import stronglifts from "./presets/stronglifts-5x5.json";
import startingStrength from "./presets/starting-strength.json";
import fullBody3x from "./presets/full-body-3x.json";
import ppl6day from "./presets/ppl-6day.json";
import upperLower4day from "./presets/upper-lower-4day.json";
import bbb531 from "./presets/531-bbb.json";
import nsuns531 from "./presets/nsuns-531.json";
import bodyweightHiit from "./presets/bodyweight-hiit.json";
import couchTo5k from "./presets/couch-to-5k.json";
import calisthenicsBeginner from "./presets/calisthenics-beginner.json";

const RAW: unknown[] = [
  stronglifts,
  startingStrength,
  fullBody3x,
  ppl6day,
  upperLower4day,
  bbb531,
  nsuns531,
  bodyweightHiit,
  couchTo5k,
  calisthenicsBeginner,
];

export const PRESETS: PresetProgram[] = RAW.map((p) => presetProgramSchema.parse(p));
export const PRESETS_BY_SLUG: Record<string, PresetProgram> = Object.fromEntries(
  PRESETS.map((p) => [p.slug, p]),
);

export function getPreset(slug: string): PresetProgram | undefined {
  return PRESETS_BY_SLUG[slug];
}
