# Mobile Workout Tracking — Phase 2 (Progress) Design

**Date:** 2026-05-25
**Status:** Approved design — ready for implementation planning
**Scope:** Add a "Progress" surface to the member mobile app — per-exercise 1RM trend, weekly volume + frequency, recent PR feed, muscle-group split, and headline stats. Pure additive feature on top of Phase 1 data.

---

## 1. Background

Phase 1 (`docs/superpowers/specs/2026-05-21-mobile-workout-tracking-design.md`)
shipped the exercise library and the live workout-logging loop. Workouts and
sets accumulate in local SQLite and sync to Supabase. The `workout_sets` table
already carries `is_pr` flags set at "Finish" time via the existing
`detectPrSets` logic, and `workouts.total_volume` is denormalised. Everything
needed to visualise progress is already in the database; the missing piece is
the analytics + UI on top.

Phase 2 closes that gap with four user-visible surfaces:

1. A per-exercise 1RM trend chart inside the existing Exercise detail screen.
2. A new "Progress" sub-screen under the Train tab showing weekly volume +
   frequency, muscle-group split, and a recent-PR feed, headed by four stat
   cards.
3. A "Progress" entry on the Train home that opens (2).
4. Reusable custom SVG chart components (`LineChart`, `BarChart`,
   `DonutChart`, `StatCard`) added to `apps/mobile/src/components/chart/`.

There is no schema change, no new sync work, no backend deploy.

## 2. Goals & non-goals

**Goals**
- Members can see, on a single screen, their training load, consistency, PR
  history, and muscle balance — recomputed locally from already-synced data.
- For any `weight_reps` exercise, the detail screen shows the member's est-1RM
  trend with a range toggle (1m / 3m / 6m / all) and a delta vs the window's
  first point.
- Derived analytics live in `@fitness/api` as pure, testable functions that
  the admin web could later reuse without code duplication.
- Charts are drawn with the existing `react-native-svg` dependency (no new
  heavy chart library) and inherit the app's design tokens.

**Non-goals (Phase 2)**
- Reactive auto-refresh of an open Progress screen when sync brings new rows
  (Phase 3).
- PRs for `reps_only` / `time` exercises (current `is_pr` flag is
  `weight_reps`-only).
- Sub-weekly aggregation (daily volume, time-of-day charts).
- Cross-device persistence of the range chip selection.
- Tooltips / interactive bar drill-down.
- Social comparison or leaderboards (separate "Social" track).
- Saving the chart range pref to `member_exercise_prefs`.

## 3. Decisions log

| # | Decision |
|---|----------|
| D1 | Scope = all four visuals (1RM trend, PB history, weekly volume + frequency, muscle split). No reduction. |
| D2 | Placement = "Progress" sub-screen under the Train tab (not a new bottom tab) PLUS the 1RM trend embedded inline in the existing Exercise detail screen. |
| D3 | Charts drawn with custom SVG components built on `react-native-svg` (already installed). No new chart library dependency. |
| D4 | Derived analytics live in `packages/api/src/workout/progress.ts` as pure functions, tested with vitest. Same pattern as `oneRepMax.ts` / `volume.ts`. |
| D5 | Time ranges: 1RM trend has a 1m/3m/6m/all chip toggle (default 3m). Weekly volume is fixed 8 weeks. Muscle split is fixed 4 weeks. PB history is all-time, capped at 20 in v1. |
| D6 | All derived series are recomputed at screen render. `useMemo` keyed on the underlying row arrays prevents recomputation across re-renders. No new caching layer. |

## 4. Architecture

```
┌─ Mobile UI ─────────────────────────────────────────┐
│  • train/progress.tsx        (new sub-screen)        │
│  • train/exercise/[id].tsx   (1RM trend section)     │
│  • components/chart/         (new SVG components)    │
│      LineChart · BarChart · DonutChart · StatCard    │
│      + format.ts (kg/k/h, mm:ss, relative dates)     │
└───────────────────┬─────────────────────────────────┘
                    │ props in: derived series
┌─ Derived analytics (@fitness/api) ──────────────────┐
│  packages/api/src/workout/progress.ts                │
│  • computeOneRepMaxSeries(sets, exerciseId)          │
│  • computeWeeklyVolume(workouts, sets, weeks=8)      │
│  • computeMuscleSplit(sets, exercises, weeks=4)      │
│  • listPbHistory(sets, exercises, limit?)            │
│  • computeStreak(workouts)                           │
│  • computeTotals(workouts, sets)                     │
│  Pure functions; vitest-coverable.                   │
└───────────────────┬─────────────────────────────────┘
                    │ input: rows from local SQLite
┌─ Local SQLite (Phase 1 — unchanged) ────────────────┐
│  exercises · workouts · workout_sets · prefs         │
└─────────────────────────────────────────────────────┘
```

**Principles**
- **Existing data only.** No schema change, no sync change, no backend
  deploy. The Phase 1 sync already pulls everything.
- **Pure analytics.** Each derived function takes rows, returns series.
  Testable in vitest, reusable by any UI.
- **Render-time compute, memoised.** Screens read SQLite in the render path
  (matching Phase 1) and wrap derived calls in `useMemo` so a re-render
  without data changes does not recompute.
- **No new heavy dependency.** All charts are custom `react-native-svg`
  components matching the rest of the codebase's component style (the same
  approach used for `RestTimerGauge.tsx`).

## 5. Derived functions

All in `packages/api/src/workout/progress.ts`. Signatures and behaviour:

### 5.1 `computeOneRepMaxSeries(sets, exerciseId)`

```ts
type DailyOneRepMax = { date: string; estOneRepMax: number };
function computeOneRepMaxSeries(
  sets: WorkoutSetRow[],
  exerciseId: string,
): DailyOneRepMax[];
```

- Filter: `s.exerciseId === exerciseId`, `!s.isWarmup`, both `s.weight` and
  `s.reps` truthy.
- Per set: `estimateOneRepMax(s.weight, s.reps)` (re-uses Phase 1).
- Group by `s.createdAt`'s `YYYY-MM-DD` (UTC).
- Each day keeps the max 1RM.
- Output sorted ascending by date.
- Empty input → `[]`.

### 5.2 `computeWeeklyVolume(workouts, sets, weeks = 8)`

```ts
type WeeklyPoint = { weekStart: string; volume: number; workoutCount: number };
function computeWeeklyVolume(
  workouts: WorkoutRow[],
  sets: WorkoutSetRow[],
  weeks?: number,
): WeeklyPoint[];
```

- `weekStart` = ISO Monday (UTC) for the week the workout's `startedAt`
  falls in.
- Window: the last `weeks` weeks ending at today's week.
- `volume`: sum of `workouts.totalVolume` over finished (`finishedAt`
  non-null, `deletedAt` null) workouts that week.
- `workoutCount`: count of those workouts.
- Weeks with zero activity are present in the output as `{volume: 0,
  workoutCount: 0}`. Output sorted oldest → newest.

### 5.3 `computeMuscleSplit(sets, exercises, weeks = 4)`

```ts
type MuscleSlice = { muscle: MuscleEnum; sets: number; pct: number };
function computeMuscleSplit(
  sets: WorkoutSetRow[],
  exercises: { id: string; primaryMuscle: MuscleEnum }[],
  weeks?: number,
): MuscleSlice[];
```

- Window: `now - weeks * 7 days`.
- Non-warmup sets only (`!s.isWarmup`).
- Exercise id → `primaryMuscle` lookup. Unknown id → `"fullBody"` bucket.
- `pct` = `sets / total * 100`, rounded to 1 decimal.
- Sorted by `pct` descending.
- Zero matching sets → `[]`.

### 5.4 `listPbHistory(sets, exercises, limit?)`

```ts
type PbEntry = {
  setId: string; workoutId: string; exerciseId: string;
  exerciseName: string;
  weight: number; reps: number; estOneRepMax: number;
  createdAt: string;
};
function listPbHistory(
  sets: WorkoutSetRow[],
  exercises: { id: string; name: string }[],
  limit?: number,
): PbEntry[];
```

- Filter: `s.isPr === true`.
- Exercise id → name lookup; unknown id → `"Exercise"` placeholder.
- Sort by `createdAt` descending (newest first).
- Optional `limit` (UI uses 20 in v1).
- Each entry includes the derived `estOneRepMax` for display.

### 5.5 `computeStreak(workouts)`

```ts
type Streak = { currentWeeks: number; longestWeeks: number };
function computeStreak(workouts: WorkoutRow[]): Streak;
```

- ISO weeks (UTC, Monday start). A week with ≥1 finished workout counts.
- `currentWeeks`: consecutive non-empty weeks ending at the current week if
  it has activity, otherwise ending at last week.
- `longestWeeks`: longest run of consecutive non-empty weeks across all
  history.

### 5.6 `computeTotals(workouts, sets)`

```ts
type Totals = {
  workouts: number; sets: number; volume: number; durationSec: number;
};
function computeTotals(workouts: WorkoutRow[], sets: WorkoutSetRow[]): Totals;
```

- `workouts`: count of finished, non-deleted workouts.
- `sets`: count of non-warmup sets.
- `volume`: sum of `workouts.totalVolume`.
- `durationSec`: sum of `workouts.durationSec`.

## 6. Chart components

All under `apps/mobile/src/components/chart/`. Stateless, presentational,
`react-native-svg`, design-tokens-driven.

### 6.1 `<LineChart>`

```ts
type LinePoint = { x: number | string; y: number };
type LineChartProps = {
  data: LinePoint[];
  height?: number;             // default 120
  strokeColor?: string;        // default tokens.color.accent
  fillColor?: string;          // default rgba(accent, 0.15)
  showLastDot?: boolean;       // default true
  yMin?: number;               // default min(y) − 5%
  yMax?: number;               // default max(y) + 5%
  accessibilityLabel?: string;
};
```

- ≥ 2 points → polyline + filled area + last-point dot.
- 1 point → single dot in the centre, no fill.
- 0 points → render nothing (caller supplies the empty-state message).

### 6.2 `<BarChart>`

```ts
type BarPoint = { label: string; value: number; meta?: number };
type BarChartProps = {
  data: BarPoint[];            // typically 8 weekly points
  height?: number;             // default 90
  barColor?: string;           // default tokens.color.accent
  dimColor?: string;           // default tokens.color.borderFaint
  gap?: number;                // default 4
  showLabels?: boolean;        // default true
};
```

- Zero-value bars rendered in `dimColor` so empty weeks are visible.
- Tallest bar uses `height − 12`.
- If `meta` is supplied, render it as a small amber badge above the bar
  (used to show workout count alongside volume).

### 6.3 `<DonutChart>`

```ts
type DonutSlice = { key: string; value: number; color: string };
type DonutChartProps = {
  data: DonutSlice[];          // sorted desc by caller
  size?: number;               // default 84
  strokeWidth?: number;        // default 12
  centerLabel?: string;        // optional
};
```

- Slices drawn with `<Circle stroke-dasharray>` and offset rotation, same
  arc-segment pattern as `RestTimerGauge.tsx` generalised to N slices.
- Empty data → single grey ring with `centerLabel ?? "No data"`.

### 6.4 `<StatCard>`

```ts
type StatCardProps = {
  value: string;
  label: string;
  tone?: 'default' | 'accent';
};
```

- Pre-formatted `value` (use `format.ts`).
- Used in a 2×2 grid on the Progress sub-screen.

### 6.5 `format.ts`

Pure helpers (vitest-tested):

```ts
formatVolumeShort(kg: number): string    // 186430 → "186k", 950 → "950", 1_500_000 → "1.5M"
formatDuration(sec: number): string      // 84600 → "23h", 5400 → "1h 30m", 45 → "0:45"
formatRelativeDate(iso: string): string  // "Today" | "Yesterday" | "3 days ago" | "Sat 17 May"
filterByRange<T extends { date: string }>(s: T[], r: '1m'|'3m'|'6m'|'all'): T[]
```

## 7. Screens & navigation

### 7.1 Train home (`(tabs)/train.tsx` — modify)

One new pressable card placed directly below the existing "Exercise library"
card. Amber accent palette (`accentSoft` background, `accent` border):

```tsx
<Pressable onPress={() => router.push('/train/progress')} style={styles.progressCard}>
  <Text style={styles.progressTitle}>📊 Progress</Text>
  <Text style={styles.progressSub}>1RM trends, PBs, weekly volume →</Text>
</Pressable>
```

### 7.2 Progress sub-screen (`train/progress.tsx` — new)

Stack route, BackButton header. Vertical sections in order:

1. Header — title "Progress" + subtitle "last 8 weeks · 4-week split".
2. 2 × 2 `<StatCard>` grid — Workouts, Streak, Volume, Total time (formatted).
3. Weekly volume + frequency — `<BarChart data={weekly} ...>`.
4. Muscle split — `<DonutChart data={split} ...>` with a legend listing the
   top 5 muscles and `+N more` if longer.
5. Recent PRs — vertical list, up to 20 entries, each row showing the
   trophy dot, exercise name, relative date, set rep count, and the weight
   pill.

**Empty state:** if `workouts.length === 0`, show the empty hero with a
"Log your first workout" message and a back action; suppress all charts.

### 7.3 Exercise detail (`train/exercise/[id].tsx` — modify)

Add a "Your 1RM trend" section between the muscle/equipment pill row and
the existing default-rest editor. Only rendered when
`exercise.metric === 'weight_reps'`.

The section contains a range chip group (`1m | 3m | 6m | all`, default 3m),
the `<LineChart>`, and a footer row with `est 1RM <latest>` + a delta
("+12 kg / 3m") coloured green for positive, neutral for zero.

Edge UI:
- 0 points in range → empty state "No data yet — log this exercise to see
  your trend".
- 1 point in range → "Need one more session to see a trend" + a single
  value line.
- Switching the range chip recomputes `series` via `useMemo`.

### 7.4 Root layout (`_layout.tsx` — modify)

Append one Stack.Screen entry:

```tsx
<Stack.Screen name="train/progress" />
```

## 8. Data flow

```
Screen render
  ↓
listWorkouts(member.dbId, 9999)        ← local SQLite, repo
listAllSetsForMember(member.dbId)      ← repo
listExercises(member.dbId)             ← repo
  ↓
useMemo(() => computeTotals(...), [workouts, sets])
useMemo(() => computeStreak(workouts), [workouts])
useMemo(() => computeWeeklyVolume(workouts, sets, 8), [workouts, sets])
useMemo(() => computeMuscleSplit(sets, exercises, 4), [sets, exercises])
useMemo(() => listPbHistory(sets, exercises, 20), [sets, exercises])
  ↓
Pass derived series to chart components → SVG rendered
```

For Exercise detail: same pattern but only `computeOneRepMaxSeries` +
`filterByRange` per chip change.

Recompute cost on ~800 sets / ~80 workouts: <10 ms in JS. No spinners.

## 9. Error handling & edge cases

| Case | Behaviour |
|------|-----------|
| `workouts.length === 0` | Progress screen empty hero; charts not rendered |
| 1RM trend has 0 points in selected range | "No data in this range" placeholder |
| 1RM trend has exactly 1 point | Single-value line with helper text |
| Exercise `metric !== 'weight_reps'` | 1RM trend section not rendered at all |
| Multiple sets the same day | `computeOneRepMaxSeries` keeps the daily max |
| Warmup sets | Excluded from every derived (volume, split, 1RM, totals) |
| Empty week between active weeks | Bar chart shows a dim zero-bar |
| Stale `is_pr` from a prior detection bug | PB list still renders sorted; not re-computed |
| Soft-deleted exercise referenced by an old set | Name lookup falls back to "Exercise"; the row remains in the list |
| `time`-metric workout (no weight) | Volume contributes 0; muscle split still counted; no 1RM line |
| 800+ workouts × 20 sets | All derived under 50 ms; no UI gating |
| App relaunched mid-Progress view | Phase-1 pattern: screen re-mounts on next nav → fresh compute |
| Sync brings new rows while Progress open | Open screen does NOT refresh (known limit; Phase 3) |

## 10. Testing strategy

**Unit (vitest, `packages/api/src/workout/__tests__/progress.test.ts`):**
- `computeOneRepMaxSeries`: same-day max, warmup excluded, ordered, null
  weight/reps excluded, other-exercise rows excluded.
- `computeWeeklyVolume`: 8-week window correct, ISO-Monday aligned, zero
  weeks present, `workoutCount` accurate, deleted workouts excluded.
- `computeMuscleSplit`: pct sums to ~100, descending order, window cutoff,
  warmup excluded, unknown id → `fullBody`.
- `listPbHistory`: only `is_pr=true`, desc by date, name lookup,
  `limit` respected.
- `computeStreak`: current-week-has-activity vs not, longest streak.
- `computeTotals`: warmup-exclusive set count, sums correct.

**Unit (vitest,
`apps/mobile/src/components/chart/__tests__/format.test.ts`):**
- `formatVolumeShort`: `186430 → "186k"`, `950 → "950"`,
  `1_500_000 → "1.5M"`.
- `formatDuration`: `84600 → "23h"`, `5400 → "1h 30m"`, `45 → "0:45"`.
- `formatRelativeDate`: today, yesterday, days-ago, old-format branches.
- `filterByRange`: `1m/3m/6m/all` window correctness.

**Chart components:** typecheck-gated + manual QA on simulator/device. No
component tests in v1 (no RN component test runner in the repo).

**Manual QA:**
- Train home shows the Progress card.
- Progress sub-screen renders 4 StatCards, 8-bar weekly chart, donut with
  top 5 muscles, ≤20 PR rows.
- A `weight_reps` exercise (Bench Press) shows the 1RM section; a `time`
  exercise (Plank) hides it; a `reps_only` exercise (Pull-up) hides it.
- Range chip switches the line chart series.
- Empty member (no workouts) → empty state on Progress, sensible empty
  states inside Exercise detail.

## 11. Files

**New**
- `packages/api/src/workout/progress.ts`
- `packages/api/src/workout/__tests__/progress.test.ts`
- `apps/mobile/src/components/chart/LineChart.tsx`
- `apps/mobile/src/components/chart/BarChart.tsx`
- `apps/mobile/src/components/chart/DonutChart.tsx`
- `apps/mobile/src/components/chart/StatCard.tsx`
- `apps/mobile/src/components/chart/format.ts`
- `apps/mobile/src/components/chart/__tests__/format.test.ts`
- `apps/mobile/src/app/train/progress.tsx`

**Modified**
- `packages/api/src/index.ts` (export `./workout/progress`)
- `apps/mobile/src/app/(tabs)/train.tsx` (Progress card)
- `apps/mobile/src/app/_layout.tsx` (register `train/progress`)
- `apps/mobile/src/app/train/exercise/[id].tsx` (1RM trend section)

No package dependencies added.

## 12. Out of scope / future

- Reactive auto-refresh of open screens after sync (Phase 3).
- PR detection / display for `reps_only` and `time` exercises.
- Daily / hourly aggregation granularity beyond what is in v1.
- Cross-device persistence of the range chip selection
  (`member_exercise_prefs` or similar).
- PB list pagination (today: capped at 20).
- Social comparisons / leaderboards (separate "Social" track).
- Export of progress data (covered by Phase 1's backup export, which
  already includes all rows the analytics rely on).
