# Train-B: Templates + Programs + Presets Design

> **For agentic workers:** Implementation plan will be written next at `docs/superpowers/plans/2026-05-26-train-b-programs.md`. This spec is the source of truth for what to build.

**Goal:** Restructure the Train tab around saved workout templates, member-built multi-week programs, and a curated preset library. "Start Workout" begins with picking a structure, not an empty session.

**Scope:** Single spec, three coupled subsystems shipped in one release — Templates → Programs → Presets.

**Approach:** Member-owned, mobile-driven, local-first (SQLite + sync engine). Sequence-based program scheduling. Curated JSON preset library bundled in the app.

**Tech Stack:** Drizzle ORM (Postgres + expo-sqlite), Supabase self-hosted, React Native 0.81/Expo 54, expo-router, zod (shared schemas).

---

## 1. Architecture

**Layered dependency chain:**

```
Presets (repo JSON, read-only, bundled)
   │
   │ "Use this program" → copy
   ▼
Programs (member-owned, sequence-based, contains days)
   │
   │ each day references →
   ▼
Templates (member-owned, rich structure)
   │
   │ "Start Workout" pre-fills →
   ▼
Active Workout (existing session-store, extended)
   │
   ▼
Completed Workout (existing workouts table, + template_id + program_day_id FKs)
```

**Ownership:** Member-only. No admin web management for templates/programs/presets. Each member owns their library; tenant scope is enforced for future-proofing.

**Local-first:** All CRUD operations write to SQLite first with `syncStatus='pending'`; the sync engine pushes to Supabase opportunistically. Pull happens on foreground/interval. Last-write-wins on `updated_at` conflict.

**Reuse:** Existing `exercises` table (873 rows from yuhonas/free-exercise-db), `session-store`, `sync-engine`, and the RLS pattern (strict tenant policies + permissive mobile-anon policies).

**Single release:** All three subsystems ship together because Programs require Templates and Presets require both. One migration, one RLS bundle, one mobile build.

---

## 2. Data Model

### New tables (Postgres + SQLite, 5 total)

#### `workout_templates`

Named workout shells with metadata.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `tenant_id` | uuid FK tenants | strict RLS |
| `member_id` | uuid FK members | owner |
| `name` | text NOT NULL | |
| `description` | text NULL | |
| `estimated_min` | int NULL | duration hint |
| `source_preset` | text NULL | preset slug if copied |
| `created_at` | timestamptz default now() | |
| `updated_at` | timestamptz default now() | |
| `deleted_at` | timestamptz NULL | soft delete |

**Indexes:** `(member_id, deleted_at)`, `(tenant_id)`

#### `workout_template_exercises`

Ordered exercise specs inside a template.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `template_id` | uuid FK workout_templates ON DELETE CASCADE | |
| `exercise_id` | uuid FK exercises ON DELETE RESTRICT | |
| `position` | int NOT NULL | ordering |
| `sets` | int NOT NULL CHECK > 0 | |
| `rep_min` | int NULL | target rep range low |
| `rep_max` | int NULL | target rep range high |
| `rest_seconds` | int NULL | rest between sets |
| `target_rpe` | numeric(3,1) NULL | 1.0–10.0 |
| `target_1rm_pct` | int NULL | 1–100 |
| `tempo` | text NULL | e.g. "3-1-1-0" |
| `superset_group` | int NULL | shared group = superset |
| `notes` | text NULL | |

**Constraints:** `UNIQUE (template_id, position)`, `CHECK (rep_min IS NULL OR rep_max IS NULL OR rep_max >= rep_min)`
**Indexes:** `(template_id, position)`

#### `programs`

Multi-week training plans with sequence-based scheduling.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `tenant_id` | uuid FK tenants | |
| `member_id` | uuid FK members | |
| `name` | text NOT NULL | |
| `description` | text NULL | |
| `weeks_count` | int NOT NULL CHECK > 0 | |
| `days_per_week` | int NOT NULL CHECK between 1 and 7 | |
| `status` | program_status NOT NULL default 'draft' | enum |
| `current_position` | int NOT NULL default 0 | next undone day ordinal |
| `source_preset` | text NULL | preset slug if copied |
| `started_at` | timestamptz NULL | activation timestamp |
| `completed_at` | timestamptz NULL | finish timestamp |
| `created_at` | timestamptz default now() | |
| `updated_at` | timestamptz default now() | |
| `deleted_at` | timestamptz NULL | soft delete |

**Indexes:** `(member_id, status, deleted_at)`, `(tenant_id)`
**Enum:** Postgres `program_status = 'draft' | 'active' | 'paused' | 'completed'`. SQLite has no enum type — column is `text` with `CHECK (status IN ('draft','active','paused','completed'))`.

App-level rule: at most one `active` program per member at a time (enforced in UI, not DB).

#### `program_days`

Ordered days inside a program. Rest days have no template.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `program_id` | uuid FK programs ON DELETE CASCADE | |
| `week` | int NOT NULL CHECK > 0 | |
| `day` | int NOT NULL CHECK between 1 and 7 | within-week index |
| `position` | int NOT NULL | `(week-1)*days_per_week + (day-1)` |
| `title` | text NOT NULL | e.g. "Push A", "Rest", "Cardio" |
| `template_id` | uuid FK workout_templates NULL | NULL = rest day |
| `is_rest` | boolean default false | |
| `notes` | text NULL | |

**Constraints:** `UNIQUE (program_id, position)`, `CHECK (is_rest = true OR template_id IS NOT NULL)`
**Indexes:** `(program_id, position)`

#### `program_day_completions`

One row per completed day. Workout day links to the workout that completed it; rest day has `workout_id` NULL.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `program_id` | uuid FK programs ON DELETE CASCADE | |
| `program_day_id` | uuid FK program_days ON DELETE CASCADE | |
| `member_id` | uuid FK members | |
| `workout_id` | uuid FK workouts NULL | NULL for rest |
| `completed_at` | timestamptz default now() | |

**Constraints:** `UNIQUE (program_id, program_day_id)`
**Indexes:** `(member_id, program_id)`

### Modified table: `workouts`

Add two columns:
- `template_id uuid FK workout_templates NULL`
- `program_day_id uuid FK program_days NULL`

`ON DELETE`: SET NULL for both — if the template or program day is later removed, the workout history persists.

### Modified table: `workout_sets`

Add seven columns to support planned sets and supersets:
- `planned_rep_min int NULL`
- `planned_rep_max int NULL`
- `planned_rest_sec int NULL`
- `planned_rpe numeric(3,1) NULL`
- `planned_1rm_pct int NULL`
- `superset_group int NULL`
- `is_complete boolean default false`

Existing `weight` and `reps` keep their semantics (actual values). Planned columns are filled at session start from the template; the user updates actuals.

### Presets — no DB

Presets are static JSON in the repo: `packages/api/src/programs/presets/*.json`. Each file is one program. They are bundled into the mobile app via TypeScript JSON import; no runtime fetch.

---

## 3. Mobile Routes + UI

### Route tree (new + modified)

```
apps/mobile/src/app/
└── train/
    ├── (tabs)/train.tsx           Train HOME — REDESIGNED
    ├── active.tsx                  active session — EXTENDED
    │
    ├── templates.tsx               template list
    ├── templates/
    │   ├── new.tsx                 create form
    │   └── [id].tsx                detail (view/edit/delete/start)
    │
    ├── programs.tsx                program list
    ├── programs/
    │   ├── new.tsx                 wizard (3 steps)
    │   ├── [id].tsx                detail (day-by-day)
    │   ├── [id]/edit.tsx           edit days
    │   ├── presets.tsx             curated library list
    │   └── presets/[slug].tsx      preset detail + "Use this"
    │
    ├── exercises.tsx               (unchanged)
    ├── exercise/[id].tsx           (unchanged)
    ├── progress.tsx                (unchanged)
    ├── challenges.tsx              (unchanged)
    └── challenge/[id].tsx          (unchanged)
```

### Train Home (redesigned)

Layout sections, top to bottom:

1. **Today** card — visible only when an active program exists. Shows the next undone day from that program with a prominent "Start workout" button.
2. **Templates** — horizontal scrollable card row, "See all" link to `/train/templates`, "+ Create template" CTA.
3. **Programs** — vertical list of member programs (max 2 shown + "See all"), "+ Browse preset library" link, "+ Create program" CTA.
4. **Quick workout** — single primary button "Start blank workout" (ad-hoc, no template).
5. **Recent workouts** — last 3 finished workouts (existing component).

### Template detail

Shows description, estimated duration, ordered exercise list with:
- Number prefix
- Exercise name
- Target line: `3 × 5 @ 80% 1RM · rest 3min`
- Superset group badge inline when grouped
- Bottom primary button: "▶ Start workout"
- Top-right `⋮` menu: Edit, Duplicate, Delete

### Template new/edit form

Single-scroll form:
1. Name (required)
2. Description (optional textarea)
3. Estimated duration (+/- buttons, optional)
4. Exercises section — repeated card per exercise:
   - "Pick exercise" picker (navigates to `ExercisePicker`)
   - Sets (+/-)
   - Reps min – max
   - Rest seconds
   - Collapsed "Advanced" section: RPE, 1RM %, Tempo, Superset group (dropdown A/B/C/none), Notes
   - Delete button
5. "+ Add exercise" CTA
6. Bottom: Cancel / Save

### Program detail

Header: name, status pill, progress line (`Week 2 of 6 · 5/18 days`), started date, action buttons (Pause/Activate, Edit, Restart).

Body: week-grouped day list. Each row shows:
- Status icon (✓ done, ▶ today, ◯ future, 💤 rest day)
- Day label (`Day 1`, `Day 2`...)
- Title (template name or "Rest")
- Completion date (if done)

Today row highlighted with accent background. Tap on today → starts workout from template. Tap on future → disabled or shows "Activate program first" if draft.

### Program new (3-step wizard)

**Step 1:** Name, weeks count, days/week (number inputs).
**Step 2:** Build week pattern. For each day-of-week slot: dropdown picking from member's templates or "Rest". Checkbox "Repeat same pattern every week" (default on). When unchecked, separate UI per week.
**Step 3:** Review (table of all days) + "Save as draft" or "Save + activate".

### Preset library list

Filter chips at top: All / Strength / Hypertrophy / Cardio / Bodyweight / Beginner. Cards show emoji icon, name, level + goal + duration, days/week + equipment summary.

### Preset detail

Header with metadata. "About" description. "Sample week" — first week's days rendered compactly. Bottom primary button: "+ Use this program".

### Exercise picker

Reuses existing `exercises.tsx` UI as a modal/picker mode. Returns selected exercise to caller. Search + category filter already present.

### Active workout (modified)

When started from template/program:
- Header subtitle: `"PPL 6 Weeks · Day 2 of 18"` or template name
- Planned set rows pre-rendered with target hints (`Target 5 × 5 @ 80%` greyed)
- Empty weight/reps inputs filled by user
- Superset groups visually grouped with badge
- Rest timer auto-starts on set complete using `planned_rest_sec`
- "+ Add extra exercise" allows adding ad-hoc exercises beyond the template

### Navigation registration

`_layout.tsx` adds 9 new Stack screens after existing `train/*` entries. Tab bar unchanged.

---

## 4. Sync + Offline

### Push order (FK-dependency-respecting)

```
1. workout_templates
2. workout_template_exercises
3. programs
4. program_days
5. workouts (existing)
6. workout_sets (existing)
7. program_day_completions
```

Each batch flushed sequentially; FK constraints prevent reordering. If a parent row hasn't reached Supabase yet (cross-device race), child push fails → row stays `syncStatus='error'` and retries next cycle.

### Pull strategy

Each table polled independently via `pull<Table>()` functions called from `useSync` hook. Filter conditions:
- `workout_templates` where `member_id = self`
- `workout_template_exercises` where `template_id IN (own templates)`
- `programs` where `member_id = self`
- `program_days` where `program_id IN (own programs)`
- `program_day_completions` where `member_id = self`

Each pull uses incremental `updated_at` cursor stored per-table in module-local state.

### Offline behavior

| Action | Online | Offline |
|---|---|---|
| Create template | SQLite insert pending → push immediately | SQLite insert pending → queues |
| Edit template | SQLite update pending → push | SQLite update → queues |
| Soft delete | SQLite update deleted_at → push | queues |
| Preset "Use this" | parse JSON → SQLite N inserts → push | queues all N rows |
| Start workout from template | reads template from SQLite | identical |
| Day complete | workout finish + completion insert → push | queues |

### Conflict resolution

Last-write-wins on `updated_at`. Two devices editing the same template: later push overwrites earlier. Two devices completing the same program day: second insert fails on `UNIQUE (program_id, program_day_id)` → local row marked `syncStatus='error'` with user-visible "Already completed elsewhere" hint.

### Sync trigger

Existing `useSync` hook (foreground + periodic interval) calls the new pull/push functions. Manual pull-to-refresh on list screens optional.

---

## 5. Preset Structure

### Location

```
packages/api/src/programs/
├── presets/
│   ├── stronglifts-5x5.json
│   ├── starting-strength.json
│   ├── full-body-3x.json
│   ├── ppl-6day.json
│   ├── upper-lower-4day.json
│   ├── 531-bbb.json
│   ├── nsuns-531.json
│   ├── bodyweight-hiit.json
│   ├── couch-to-5k.json
│   └── calisthenics-beginner.json
├── preset-schema.ts       zod validator + types
└── preset-loader.ts       load + validate at module init
```

### Schema (zod)

```ts
export const PRESET_LEVELS = ["beginner","intermediate","advanced"] as const;
export const PRESET_GOALS  = ["strength","hypertrophy","cardio","bodyweight","general"] as const;

export const presetExerciseSchema = z.object({
  exerciseSlug:   z.string().min(1),
  sets:           z.number().int().positive(),
  repMin:         z.number().int().positive().nullable(),
  repMax:         z.number().int().positive().nullable(),
  restSeconds:    z.number().int().nonnegative().nullable(),
  targetRpe:      z.number().min(1).max(10).nullable(),
  target1rmPct:   z.number().int().min(1).max(100).nullable(),
  tempo:          z.string().nullable(),
  supersetGroup:  z.number().int().nullable(),
  notes:          z.string().nullable(),
});

export const presetDaySchema = z.object({
  week:       z.number().int().positive(),
  day:        z.number().int().min(1).max(7),
  title:      z.string().min(1),
  isRest:     z.boolean().default(false),
  exercises:  z.array(presetExerciseSchema).default([]),
  notes:      z.string().nullable().optional(),
});

export const presetProgramSchema = z.object({
  slug:           z.string().regex(/^[a-z0-9-]+$/),
  name:           z.string().min(1),
  description:    z.string(),
  authorCredit:   z.string().nullable(),
  weeks:          z.number().int().positive(),
  daysPerWeek:    z.number().int().min(1).max(7),
  level:          z.enum(PRESET_LEVELS),
  goal:           z.enum(PRESET_GOALS),
  tags:           z.array(z.string()).default([]),
  equipmentNeeded:z.array(z.string()).default([]),
  days:           z.array(presetDaySchema),
}).superRefine((p, ctx) => {
  if (p.days.length !== p.weeks * p.daysPerWeek) {
    ctx.addIssue({
      code: "custom",
      message: `days count ${p.days.length} ≠ weeks×daysPerWeek (${p.weeks * p.daysPerWeek})`,
    });
  }
});

export type PresetProgram = z.infer<typeof presetProgramSchema>;
```

### Loader

```ts
import { presetProgramSchema, type PresetProgram } from "./preset-schema";
import stronglifts from "./presets/stronglifts-5x5.json";
// ...one import per preset file

const RAW = [stronglifts /* ... */];
export const PRESETS: PresetProgram[] = RAW.map(p => presetProgramSchema.parse(p));
export const PRESETS_BY_SLUG = Object.fromEntries(PRESETS.map(p => [p.slug, p]));
export function getPreset(slug: string): PresetProgram | undefined {
  return PRESETS_BY_SLUG[slug];
}
```

### Exercise slug validation

Build-time: vitest test checks every preset's `exerciseSlug` references against a slug allowlist dump (`packages/db/seed/exercise-slugs.txt`, generated from `select slug from exercises`).

Runtime: "Use this program" precheck enumerates required slugs vs the local `exercises` SQLite cache. If any missing → modal listing missing slugs, abort creation.

### "Use this program" copy semantics

```
tap → preset JSON in memory
   │
   ▼
1. INSERT programs (member_id, name=preset.name, description=preset.description,
                    weeks_count=preset.weeks, days_per_week=preset.daysPerWeek,
                    source_preset=preset.slug, status='draft', current_position=0)
   → returns programId
   │
   ▼
2. Group preset.days by day.title → unique titles map to new templates
   For each unique title:
     INSERT workout_templates (member_id, name=title, source_preset=preset.slug, ...)
     For each exercise in first day with that title:
       INSERT workout_template_exercises (template_id, exercise_id from exerciseSlug lookup, position, ...)
   Cache: titleToTemplateId
   │
   ▼
3. For each day in preset.days:
     INSERT program_days {
       program_id, week, day, position=(week-1)*daysPerWeek + (day-1),
       title, template_id=titleToTemplateId[day.title] or NULL if isRest,
       is_rest
     }
   │
   ▼
4. UI navigates to /train/programs/[newId] (draft state)
   User can: rename, edit days, activate
```

### Initial library (10 programs)

| Slug | Name | Weeks | Days/wk | Level | Goal | Equipment |
|---|---|---|---|---|---|---|
| `stronglifts-5x5` | StrongLifts 5×5 | 12 | 3 | beginner | strength | barbell |
| `starting-strength` | Starting Strength | 12 | 3 | beginner | strength | barbell |
| `full-body-3x` | Full Body 3×/Week | 8 | 3 | beginner | general | mixed |
| `ppl-6day` | Push/Pull/Legs 6-Day | 6 | 6 | intermediate | hypertrophy | mixed |
| `upper-lower-4day` | Upper/Lower 4-Day | 8 | 4 | intermediate | hypertrophy | mixed |
| `531-bbb` | 5/3/1 Boring But Big | 8 | 4 | advanced | strength | barbell |
| `nsuns-531` | nSuns 5/3/1 LP | 10 | 4 | advanced | strength | barbell |
| `bodyweight-hiit` | Bodyweight HIIT | 6 | 4 | beginner | bodyweight | none |
| `couch-to-5k` | Couch to 5K | 9 | 3 | beginner | cardio | none |
| `calisthenics-beginner` | Calisthenics Beginner | 8 | 3 | beginner | bodyweight | none |

All public-domain programs or generic naming; no licensing risk.

### Sample preset (truncated)

```json
{
  "slug": "stronglifts-5x5",
  "name": "StrongLifts 5×5",
  "description": "Classic linear progression for absolute beginners.",
  "authorCredit": "Mehdi (StrongLifts.com)",
  "weeks": 12,
  "daysPerWeek": 3,
  "level": "beginner",
  "goal": "strength",
  "tags": ["strength","beginner","barbell","linear-progression"],
  "equipmentNeeded": ["barbell","rack","bench"],
  "days": [
    { "week":1, "day":1, "title":"Workout A", "isRest": false, "exercises":[
      {"exerciseSlug":"barbell-squat","sets":5,"repMin":5,"repMax":5,"restSeconds":180,"targetRpe":null,"target1rmPct":null,"tempo":null,"supersetGroup":null,"notes":null}
    ]}
  ]
}
```

Approximate size: 36 days × 3 exercises × ~15 fields ≈ 1.6KB per preset; 10 presets ≈ 16KB total bundle impact.

---

## 6. Active Workout Integration

### `session-store.tsx` API change

```ts
type StartOptions = {
  sourceWorkoutId?: string;   // existing "repeat last"
  templateId?: string;        // start from template
  programDayId?: string;      // start from program day
};

startWorkout: (opts?: StartOptions) => void;
```

### Behavior matrix

| `opts` | Workout creation |
|---|---|
| `{}` | Empty workout, title "Workout" (current behavior) |
| `{sourceWorkoutId}` | Copy sets from past workout (existing behavior) |
| `{templateId}` | Title = `template.name`; insert N planned `workout_sets` with `planned_*` filled, `weight`/`reps` NULL; `workouts.template_id = templateId` |
| `{programDayId}` | Lookup day → derive `template_id`; apply `{templateId}` flow; `workouts.program_day_id = programDayId`; title = `"<template_name> — W<week>D<day>"` |

### Planned sets

When inserted from a template, each `workout_sets` row gets:
- `planned_rep_min/max/rest_sec/rpe/1rm_pct/superset_group` from the template exercise
- `weight` and `reps` NULL
- `is_complete = false`

The active screen reads `planned_*` to render target hints. User fills `weight` + `reps` and taps complete → `is_complete = true`, current set highlighted, rest timer auto-starts with `planned_rest_sec`.

### Active screen UI delta

Header shows program subtitle when applicable. Each exercise card displays target line above set rows. Superset groups visually grouped with a badge ("SUPERSET A") and rendered interleaved (A1, B1, A2, B2, ...). "Auto-fill from last set" quick action copies last completed set's weight/reps into the next planned set.

"+ Add extra exercise" allows ad-hoc additions that aren't in the template (these get `planned_*` = NULL).

### Finish flow

```
finishWorkout():
  1. workout row update: finished_at = now, duration_sec, total_volume = sum(weight*reps for completed sets)
  2. Unfilled planned sets (weight IS NULL AND is_complete=false) are kept in DB as "skipped" rows — useful for reporting (template adherence %). Not deleted.
  3. If workouts.program_day_id IS NOT NULL:
        INSERT program_day_completions (program_id, program_day_id, member_id, workout_id, completed_at=now)
        UPDATE programs SET current_position = current_position + 1, updated_at = now
               WHERE id = program_id AND current_position < (weeks_count * days_per_week)
        If current_position reaches total → status = 'completed', completed_at = now
  4. syncStatus = 'pending' on all touched rows
```

### Today calculation

Train home + program detail call:

```ts
const program = activePrograms[0];                       // status='active'
const nextPos = program.current_position;
const today = program_days.find(d => d.position === nextPos);
// today.is_rest → Rest day card with "Mark complete" button
// today.template_id → template card with "Start workout" button
```

Rest day "Mark complete" → insert completion row (`workout_id` NULL) + advance position.

### Multi-active program rule

UI-only: when activating a new program while another is active, show confirm modal "Pause '<current>' and activate this?" → on confirm, set old `status='paused'`, new `status='active'`. No DB constraint.

### Template deletion safety

`ON DELETE RESTRICT` on `workout_template_exercises.exercise_id` prevents accidental exercise removal while referenced. Template soft-delete (`deleted_at` set) does not cascade — completed workouts retain their `template_id` reference, UI shows "(deleted)" suffix.

### Workout_sets migration delta

7 new nullable columns added; no data migration needed. Existing workouts work unchanged (all planned_* NULL).

---

## 7. Edge Cases

### Data integrity

| Scenario | Behavior |
|---|---|
| Try to delete an exercise referenced by template | DB rejects (RESTRICT); UI shows error |
| Soft-delete template | Set `deleted_at`; existing workouts/program_days keep FK; UI shows "(deleted)" placeholder |
| Hard-delete program | CASCADE: program_days + completions removed; `workouts.program_day_id` set to NULL |
| Edit completed program day | UI disallows; only future days editable |
| Two devices create template offline | Two UUIDs → both push successfully as separate rows |
| Two devices edit same template offline | Last `updated_at` wins; earlier change silently overwritten |
| Two devices complete same day | UNIQUE constraint rejects second; second device shows "Already completed elsewhere" |

### Preset edge cases

| Scenario | Behavior |
|---|---|
| Preset references missing `exerciseSlug` | "Use this" precheck modal lists missing slugs; abort |
| Malformed JSON survives build validation | Loader catches parse error; preset hidden from library |
| Same preset "Used" twice | New independent copy; no dedup |
| Preset JSON updated in new app version | Existing member copies unchanged; new "Use" gets new content |

### Schedule

| Scenario | Behavior |
|---|---|
| Skip rest day | Must "Mark rest complete" — never auto-advanced |
| Out-of-order completion | UI only enables next undone day; future v2 may allow jumping |
| Undo a completion | V1: not supported |
| All days completed | `status='completed'`, `completed_at` set; Today card disappears; detail shows "🎉 Completed" |
| Activate while another active | Modal prompts pause-and-swap |
| Days tap while program is draft | Disabled with "Activate program first" hint |

### Sync

| Scenario | Behavior |
|---|---|
| Offline mass create (preset "Use") | All N rows queued pending; pushed in FK order when online |
| FK race on push (child before parent on server) | Child push errors; retried next cycle after parent lands |
| Member switches gyms (tenant change) | New tenant pull; old-tenant local rows orphaned but harmless |

### UI validation

| Scenario | Behavior |
|---|---|
| Template name empty | Save disabled |
| Template with zero exercises | Save disabled, hint "Add at least 1 exercise" |
| `sets=0` | Input enforces min=1; DB CHECK > 0 |
| `repMin > repMax` | Form swaps or warns; DB CHECK enforces |
| Superset group with single exercise | Save auto-clears `supersetGroup` to NULL |
| Program with all-rest days | Save disabled, hint "Add at least 1 workout day" |

### Security / RLS

| Scenario | Behavior |
|---|---|
| Mobile anon could query other member's templates | RLS permissive `using(true)`; same Phase-1/Social-A tradeoff. UI filters by `member_id`, no DB enforcement |
| Cross-member day completion | Possible at DB level via mobile anon; UI prevents |
| Future strict JWT-based RLS | Phase-1, Social-A, and Train-B mobile-anon policies retired together |

### Migration

| Scenario | Behavior |
|---|---|
| Postgres migration fails mid-flight | Drizzle wraps in transaction; rolls back atomically |
| SQLite migration on old client fails | Defensive try/catch; fallback rebuild local DB (preset/template re-pull from cloud or re-import) |
| Old mobile app + new DB | Forward-compatible: new nullable columns ignored |
| New mobile app + old DB | Not supported; min app version required |

---

## 8. File Inventory

### `packages/api/`

**Create:**
- `src/programs/preset-schema.ts`
- `src/programs/preset-loader.ts`
- `src/programs/templates.ts` — `workoutTemplateInputSchema`, `templateExerciseInputSchema`
- `src/programs/programs.ts` — `programInputSchema`, `programDayInputSchema`, `PROGRAM_STATUSES`
- 10 × `src/programs/presets/*.json`

**Modify:**
- `src/index.ts` — re-export new modules

**Test:**
- `src/programs/__tests__/preset-loader.test.ts`
- `src/programs/__tests__/schemas.test.ts`

### `packages/db/`

**Create:**
- `src/schema/programStatus.ts` — pgEnum
- `src/schema/workoutTemplates.ts`
- `src/schema/workoutTemplateExercises.ts`
- `src/schema/programs.ts`
- `src/schema/programDays.ts`
- `src/schema/programDayCompletions.ts`
- `src/seed/exercise-slugs.txt` — slug allowlist for preset validation

**Modify:**
- `src/schema/workouts.ts` — add `templateId`, `programDayId`
- `src/schema/workoutSets.ts` — add 7 columns
- `src/schema/index.ts` — export new tables

**Generated:**
- `migrations/0007_<adjective>_<noun>.sql` — drizzle output + manual CHECK additions

### `infra/supabase/`

**Create:**
- `policies/0007_programs_policies.sql` — RLS for 5 new tables (strict + mobile-anon)

### `apps/mobile/`

**Create — DB layer:**
- `src/db/schema/workoutTemplates.ts`
- `src/db/schema/workoutTemplateExercises.ts`
- `src/db/schema/programs.ts`
- `src/db/schema/programDays.ts`
- `src/db/schema/programDayCompletions.ts`
- `src/db/migrations/004_train_b.ts` — SQLite migration
- `src/db/api/templates.ts`
- `src/db/api/programs.ts`
- `src/db/api/presets.ts` — `copyPresetToProgram(slug)` returns programId

**Create — UI screens:**
- `src/app/train/templates.tsx`
- `src/app/train/templates/new.tsx`
- `src/app/train/templates/[id].tsx`
- `src/app/train/programs.tsx`
- `src/app/train/programs/new.tsx`
- `src/app/train/programs/[id].tsx`
- `src/app/train/programs/[id]/edit.tsx`
- `src/app/train/programs/presets.tsx`
- `src/app/train/programs/presets/[slug].tsx`

**Create — components:**
- `src/components/TemplateCard.tsx`
- `src/components/ProgramCard.tsx`
- `src/components/ProgramDayRow.tsx`
- `src/components/TemplateExerciseEditor.tsx`
- `src/components/SupersetGroupBadge.tsx`
- `src/components/ExercisePicker.tsx`
- `src/components/PresetCard.tsx`
- `src/components/TodayCard.tsx`

**Modify:**
- `src/app/(tabs)/train.tsx` — full redesign
- `src/app/_layout.tsx` — register 9 new Stack screens
- `src/app/train/active.tsx` — planned set rendering + superset visuals + subtitle
- `src/workout/session-store.tsx` — new `StartOptions`, planned set insertion, program completion
- `src/workout/sync-engine.ts` — add pulls + push order for new tables
- `src/db/schema/workouts.ts` — add `templateId`, `programDayId`
- `src/db/schema/workoutSets.ts` — add 7 columns
- `src/db/schema/index.ts` — export new tables

**Test:**
- `src/db/api/__tests__/templates.test.ts`
- `src/db/api/__tests__/programs.test.ts`
- `src/db/api/__tests__/presets.test.ts`
- `src/workout/__tests__/session-store-template.test.ts`

### `apps/web/`

No changes (admin web does not manage templates/programs in this release).

### `docs/`

- `docs/superpowers/specs/2026-05-26-train-b-programs-design.md` — this spec
- `docs/superpowers/plans/2026-05-26-train-b-programs.md` — implementation plan (next step)

### Migration deployment order

1. `packages/db` schema changes + `drizzle-kit generate`
2. Supabase VPS: drizzle migrate in node:20 container on `supabase_default`
3. Supabase VPS: `psql -f policies/0007_programs_policies.sql`
4. Mobile app: SQLite migration 004 applied on next open (auto)
5. Mobile rebuild: Expo Go (dev) / EAS build (prod)

### Totals

~54 new files, ~10 modified files.

---

## 9. Out of Scope (v1)

- Admin web management of templates/programs (member-only release)
- Strict JWT-based RLS (deferred to Phase-1/SA/Train-B joint upgrade)
- Day-completion undo
- Out-of-order day completion (jump-ahead)
- External program API integration
- Calendar-based scheduling (sequence-based only)
- Coach/trainer assigning programs to members
- Sharing templates between members
- Program effectiveness analytics
- Custom preset submissions (preset library is repo-curated)
- Rest day templates (rest = no template, simple)
- Cardio-specific tracking (duration/distance/pace); current schema is rep-based; Couch to 5K preset will use bodyweight + reps placeholder until cardio tracking lands separately

---

## 10. Success Criteria

- Member can create, edit, delete, and start a workout from a template (mobile)
- Member can build a custom multi-week program and activate it
- "Today" card on Train home shows the next undone day of the active program with one-tap start
- Member can browse 10 preset programs, see structure, and copy one into their library
- Active workout pre-fills planned sets with target hints; completing the workout advances program position
- All CRUD works offline; sync engine reconciles on reconnection
- Data integrity: deleting an exercise referenced by a template is blocked; soft-deleting a template preserves history
- Verification: `pnpm -r typecheck && pnpm -r test` passes; preset slug allowlist test passes
- VPS deploy: migration + RLS + container rebuild green; admin web unaffected
