# Health Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** When a member finishes a gym workout, push that workout to Apple Health (iOS) or Health Connect (Android). Opt-in via Profile → Health Integrations toggle. Push-only, no biometric reads, no live HR.

**Architecture:** A unified `lib/health/` module dispatches to platform-specific writers behind a TypeScript interface. The session store fires-and-forgets a health write on `finishWorkout`. Failed writes increment `health_attempts`, retried on app foreground and via manual sync. Settings screen owns the toggle, status display, and disconnect flow. Native modules require EAS dev client (no Expo Go).

**Tech Stack:** `react-native-health` (iOS), `react-native-health-connect` (Android), expo-secure-store, drizzle (Postgres + SQLite), Expo SDK 54 / React Native 0.81, EAS dev client.

**Spec:** `docs/superpowers/specs/2026-05-28-health-integration-design.md`

**Branch:** `feat/health-integration` (created, spec committed as `c062383`).

---

## Codebase Patterns (Read Before Starting)

### DB schema

- `packages/db/src/schema/workouts.ts` — drizzle Postgres definition
- `apps/mobile/src/db/schema.ts` — drizzle SQLite mirror (single file)
- `apps/mobile/src/db/client.ts` — `MIGRATIONS: string[][]` append-only array. Each entry is a schema version (v1→v2 = entries[0], v2→v3 = entries[1], etc). Add new entry for v3→v4.
- `packages/db/migrations/` — drizzle-kit generated SQL files

### Mobile patterns

- Tenant context via `useTenantStore` from `lib/tenant-store.ts`
- Theme via `useTheme` from `lib/theme-provider.tsx` (gives `accent`, `accentSoft`)
- Components use `BackButton` (not BackButtonRow). `ScreenContainer` wraps screens.
- TypeScript `noUncheckedIndexedAccess: true` — use `!` after length checks or `?? null` after array access
- Test pattern: vitest with `vi.mock()` for native modules; vitest config aliases `expo-sqlite`

### Native module rules

- Expo Go does NOT support these — require EAS dev client build
- Plugin config in `app.json` `plugins` array
- iOS Info.plist usage descriptions managed by plugin
- Android permissions managed by plugin
- Local dev: `npx expo prebuild --clean` regenerates native dirs, but with managed workflow we don't commit them; EAS handles it

### Test commands

```
pnpm -r typecheck
pnpm -r test
pnpm --filter @fitness/mobile test
pnpm --filter @fitness/mobile vitest run src/lib/health/__tests__/sync.test.ts
```

### Forbidden patterns

- NEVER `git add -A` / `git add .`
- NEVER stage `" 2"`-suffix iCloud dups
- NEVER run `npm install` inside node:20 container on VPS — mutates package.json

### VPS deploy pattern

Tailscale `root@100.67.196.22`. Repo `/srv/fitclub-os`. Migration via node:20 container on `supabase_default` network. Always `git checkout -- packages/db/package.json` after migrate (npm install mutates it).

---

## Task 1: Postgres schema — workouts +3 columns

**Files:**
- Modify: `packages/db/src/schema/workouts.ts`

- [ ] **Step 1: Read current schema**

```bash
grep -n "healthSynced\|healthUuid\|healthAttempts" packages/db/src/schema/workouts.ts
```

Expected: 0 matches (columns don't exist yet).

- [ ] **Step 2: Add columns to drizzle definition**

Edit `packages/db/src/schema/workouts.ts`. Inside the `pgTable("workouts", { ... })` column block, after the existing columns and before the index callback if present, add:

```ts
healthSynced: boolean("health_synced").notNull().default(false),
healthUuid: text("health_uuid"),
healthAttempts: integer("health_attempts").notNull().default(0),
```

Ensure `boolean` and `integer` are imported at the top of the file (they likely already are):

```ts
import { boolean, integer, pgTable, text, ... } from "drizzle-orm/pg-core";
```

- [ ] **Step 3: Typecheck**

```bash
pnpm --filter @fitness/db typecheck
```

Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add packages/db/src/schema/workouts.ts
git commit -m "feat(db): workouts +3 health sync columns

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 2: Generate Postgres migration

**Files:**
- Create (generated): `packages/db/migrations/0010_<name>.sql`

- [ ] **Step 1: Run drizzle generate**

```bash
pnpm --filter @fitness/db exec drizzle-kit generate
```

Note the generated filename, e.g. `0010_smooth_jaguar.sql`.

- [ ] **Step 2: Verify migration content**

```bash
cat packages/db/migrations/0010_*.sql
```

Expected: 3 ALTER TABLE statements:
- `ALTER TABLE "workouts" ADD COLUMN "health_synced" boolean DEFAULT false NOT NULL;`
- `ALTER TABLE "workouts" ADD COLUMN "health_uuid" text;`
- `ALTER TABLE "workouts" ADD COLUMN "health_attempts" integer DEFAULT 0 NOT NULL;`

- [ ] **Step 3: Commit**

```bash
git add packages/db/migrations/0010_*.sql packages/db/migrations/meta/
git commit -m "feat(db): 0010 migration — workouts health sync columns

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 3: SQLite schema + migration v4

**Files:**
- Modify: `apps/mobile/src/db/schema.ts`
- Modify: `apps/mobile/src/db/client.ts`

- [ ] **Step 1: Update SQLite schema**

Edit `apps/mobile/src/db/schema.ts`. Find the `workouts` table definition. Inside its column block, add (booleans are integers 0/1 in SQLite):

```ts
healthSynced: integer("health_synced").notNull().default(0),
healthUuid: text("health_uuid"),
healthAttempts: integer("health_attempts").notNull().default(0),
```

- [ ] **Step 2: Append migration v3 → v4 in client.ts**

Edit `apps/mobile/src/db/client.ts`. Find the `MIGRATIONS: string[][]` array. Append a new entry (the 3rd or 4th element depending on current count):

```ts
  // v3 -> v4 — Health Integration: workout sync tracking
  [
    `ALTER TABLE workouts ADD COLUMN health_synced INTEGER NOT NULL DEFAULT 0;`,
    `ALTER TABLE workouts ADD COLUMN health_uuid TEXT;`,
    `ALTER TABLE workouts ADD COLUMN health_attempts INTEGER NOT NULL DEFAULT 0;`,
  ],
```

- [ ] **Step 3: Typecheck**

```bash
pnpm --filter @fitness/mobile typecheck
```

Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add apps/mobile/src/db/schema.ts apps/mobile/src/db/client.ts
git commit -m "feat(mobile): SQLite v4 migration — workouts health sync columns

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 4: Install native packages + Expo plugin config + EAS profile

**Files:**
- Modify: `apps/mobile/package.json`
- Modify: `apps/mobile/app.json`
- Modify: `apps/mobile/eas.json` (create if missing)

- [ ] **Step 1: Install packages**

```bash
cd apps/mobile
npx expo install react-native-health
npx expo install react-native-health-connect
```

This adds the packages to `package.json` with versions that match Expo SDK 54 compatibility.

- [ ] **Step 2: Add plugins to app.json**

Open `apps/mobile/app.json`. Find the `expo.plugins` array (create if missing). Append:

```json
[
  "react-native-health",
  {
    "isClinicalDataEnabled": false,
    "healthSharePermission": "Read your workout and biometric history.",
    "healthUpdatePermission": "Save your gym workouts to Apple Health."
  }
],
[
  "react-native-health-connect",
  {
    "permissions": [
      "android.permission.health.WRITE_EXERCISE",
      "android.permission.health.READ_EXERCISE"
    ]
  }
]
```

(If the plugins array already exists, ADD these two entries. Don't replace existing plugins.)

- [ ] **Step 3: Create or update eas.json**

`apps/mobile/eas.json`:

```json
{
  "cli": {
    "version": ">= 14.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "ios": {
        "simulator": false,
        "resourceClass": "m-medium"
      },
      "android": {
        "buildType": "apk"
      }
    },
    "preview": {
      "distribution": "internal"
    },
    "production": {
      "autoIncrement": true
    }
  },
  "submit": {
    "production": {}
  }
}
```

If `eas.json` already exists, merge the `development` profile into the existing `build` object. Preserve any existing `production`, `preview`, or `submit` settings.

- [ ] **Step 4: Typecheck**

```bash
pnpm --filter @fitness/mobile typecheck
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/mobile/package.json apps/mobile/app.json apps/mobile/eas.json pnpm-lock.yaml
git commit -m "feat(mobile): add react-native-health + health-connect packages + EAS dev profile

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 5: lib/health storage keys + unified types

**Files:**
- Create: `apps/mobile/src/lib/health/storage-keys.ts`
- Create: `apps/mobile/src/lib/health/types.ts`

- [ ] **Step 1: Create storage keys**

`apps/mobile/src/lib/health/storage-keys.ts`:

```ts
export const HEALTH_OPT_IN_KEY = "fitclub.health.opt_in";
export const HEALTH_LAST_SYNC_KEY = "fitclub.health.last_sync";
```

- [ ] **Step 2: Create shared types**

`apps/mobile/src/lib/health/types.ts`:

```ts
export type HealthWorkoutPayload = {
  workoutId: string;
  startedAt: string;
  finishedAt: string;
  durationSec: number;
  totalEnergyKcal: number | null;
  exerciseType: "strength_training" | "other";
  notes: string | null;
};

export type HealthResult =
  | { ok: true; recordId: string }
  | { ok: false; error: string };

export type HealthSyncSummary = {
  total: number;
  synced: number;
  failed: number;
};
```

- [ ] **Step 3: Typecheck**

```bash
pnpm --filter @fitness/mobile typecheck
```

Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add apps/mobile/src/lib/health/storage-keys.ts apps/mobile/src/lib/health/types.ts
git commit -m "feat(mobile): lib/health storage keys + shared types

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 6: lib/health/ios-healthkit.ts (iOS writer)

**Files:**
- Create: `apps/mobile/src/lib/health/ios-healthkit.ts`

- [ ] **Step 1: Write iOS implementation**

`apps/mobile/src/lib/health/ios-healthkit.ts`:

```ts
import AppleHealthKit from "react-native-health";
import type { HealthWorkoutPayload, HealthResult } from "./types";

const PERMS = {
  permissions: {
    read: [AppleHealthKit.Constants.Permissions.Workout],
    write: [
      AppleHealthKit.Constants.Permissions.Workout,
      AppleHealthKit.Constants.Permissions.ActiveEnergyBurned,
    ],
  },
} as const;

export function isAvailable(): Promise<boolean> {
  return new Promise((resolve) => {
    AppleHealthKit.isAvailable((err, available) => {
      resolve(!err && available);
    });
  });
}

export function requestPermission(): Promise<boolean> {
  return new Promise((resolve) => {
    AppleHealthKit.initHealthKit(PERMS as never, (err) => {
      resolve(!err);
    });
  });
}

export async function writeWorkout(
  payload: HealthWorkoutPayload,
): Promise<HealthResult> {
  return new Promise((resolve) => {
    AppleHealthKit.saveWorkout(
      {
        type: "FunctionalStrengthTraining" as never,
        startDate: payload.startedAt,
        endDate: payload.finishedAt,
        energyBurned: payload.totalEnergyKcal ?? undefined,
        distance: 0,
        metadata: {
          HKExternalUUID: payload.workoutId,
          HKWorkoutBrandName: "FitClub",
          Notes: payload.notes ?? "",
        } as never,
      },
      (err: unknown, result: unknown) => {
        if (err) resolve({ ok: false, error: String(err) });
        else resolve({ ok: true, recordId: String(result) });
      },
    );
  });
}
```

(`as never` casts handle the loose typings in `react-native-health`. Adjust if the package emits cleaner types.)

- [ ] **Step 2: Typecheck**

```bash
pnpm --filter @fitness/mobile typecheck
```

Expected: PASS. If `AppleHealthKit.Constants.Permissions.Workout` is undefined per types, add a fallback string literal:

```ts
const PERMS = {
  permissions: {
    read: ["Workout"] as never,
    write: ["Workout", "ActiveEnergyBurned"] as never,
  },
} as const;
```

- [ ] **Step 3: Commit**

```bash
git add apps/mobile/src/lib/health/ios-healthkit.ts
git commit -m "feat(mobile): iOS HealthKit writer

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 7: lib/health/android-hc.ts (Android writer)

**Files:**
- Create: `apps/mobile/src/lib/health/android-hc.ts`

- [ ] **Step 1: Write Android implementation**

`apps/mobile/src/lib/health/android-hc.ts`:

```ts
import {
  initialize,
  requestPermission as hcRequestPermission,
  insertRecords,
} from "react-native-health-connect";
import type { HealthWorkoutPayload, HealthResult } from "./types";

const PERMS = [
  { accessType: "write" as const, recordType: "ExerciseSession" as const },
  { accessType: "write" as const, recordType: "ActiveCaloriesBurned" as const },
  { accessType: "read" as const, recordType: "ExerciseSession" as const },
];

export async function isAvailable(): Promise<boolean> {
  try {
    await initialize();
    return true;
  } catch {
    return false;
  }
}

export async function requestPermission(): Promise<boolean> {
  await initialize();
  const granted = await hcRequestPermission(PERMS);
  return granted.length === PERMS.length;
}

export async function writeWorkout(
  payload: HealthWorkoutPayload,
): Promise<HealthResult> {
  try {
    await initialize();
    const records: unknown[] = [
      {
        recordType: "ExerciseSession",
        startTime: payload.startedAt,
        endTime: payload.finishedAt,
        exerciseType: 13, // EXERCISE_TYPE_STRENGTH_TRAINING
        title: "Gym Workout",
        notes: payload.notes ?? undefined,
        metadata: { clientRecordId: payload.workoutId },
      },
    ];
    if (payload.totalEnergyKcal != null) {
      records.push({
        recordType: "ActiveCaloriesBurned",
        startTime: payload.startedAt,
        endTime: payload.finishedAt,
        energy: { value: payload.totalEnergyKcal, unit: "kilocalories" },
      });
    }
    const ids = await insertRecords(records as never);
    return { ok: true, recordId: ids[0] ?? "" };
  } catch (e: any) {
    return { ok: false, error: e?.message ?? String(e) };
  }
}
```

- [ ] **Step 2: Typecheck**

```bash
pnpm --filter @fitness/mobile typecheck
```

Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add apps/mobile/src/lib/health/android-hc.ts
git commit -m "feat(mobile): Android Health Connect writer

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 8: lib/health/index.ts (unified API)

**Files:**
- Create: `apps/mobile/src/lib/health/index.ts`

- [ ] **Step 1: Write platform dispatcher**

`apps/mobile/src/lib/health/index.ts`:

```ts
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
```

- [ ] **Step 2: Typecheck**

```bash
pnpm --filter @fitness/mobile typecheck
```

Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add apps/mobile/src/lib/health/index.ts
git commit -m "feat(mobile): lib/health unified platform dispatcher

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 9: lib/health/feature-flag.ts

**Files:**
- Create: `apps/mobile/src/lib/health/feature-flag.ts`

- [ ] **Step 1: Write feature flag reader**

`apps/mobile/src/lib/health/feature-flag.ts`:

```ts
import { getSupabase } from "../supabase";

let cached: boolean | null = null;

/**
 * Reads `app_config.health_sync_enabled` from Supabase. Default: enabled.
 * Cached in module memory for the session — restart app to refresh.
 *
 * Remote disable:
 *   INSERT INTO app_config (key, value) VALUES ('health_sync_enabled', 'false')
 *     ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
 */
export async function isHealthSyncFeatureEnabled(): Promise<boolean> {
  if (cached !== null) return cached;
  const supabase = getSupabase();
  if (!supabase) {
    cached = true;
    return true;
  }
  const { data } = await supabase
    .from("app_config")
    .select("value")
    .eq("key", "health_sync_enabled")
    .maybeSingle();
  cached = data?.value !== "false";
  return cached;
}

export function resetFeatureFlagCache(): void {
  cached = null;
}
```

- [ ] **Step 2: Typecheck**

```bash
pnpm --filter @fitness/mobile typecheck
```

Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add apps/mobile/src/lib/health/feature-flag.ts
git commit -m "feat(mobile): health sync remote feature flag

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 10: lib/health/sync.ts + tests (TDD)

**Files:**
- Create: `apps/mobile/src/lib/health/sync.ts`
- Create: `apps/mobile/src/lib/health/__tests__/sync.test.ts`

- [ ] **Step 1: Write failing tests**

`apps/mobile/src/lib/health/__tests__/sync.test.ts`:

```ts
import { describe, it, expect, vi } from "vitest";

vi.mock("../../../db/client", () => ({
  db: {
    select: () => ({
      from: () => ({
        where: () => ({
          all: () => [],
        }),
      }),
    }),
    update: () => ({
      set: () => ({
        where: () => ({
          run: () => undefined,
        }),
      }),
    }),
  },
}));

vi.mock("../index", () => ({
  isHealthAvailable: vi.fn(async () => false),
  writeWorkoutToHealth: vi.fn(async () => ({ ok: false, error: "stub" })),
}));

vi.mock("../feature-flag", () => ({
  isHealthSyncFeatureEnabled: vi.fn(async () => true),
}));

vi.mock("expo-secure-store", () => ({
  getItemAsync: vi.fn(async () => "false"),
  setItemAsync: vi.fn(async () => undefined),
  deleteItemAsync: vi.fn(async () => undefined),
}));

import { estimateKcal, toPayload } from "../sync";

describe("estimateKcal", () => {
  it("returns 0 for 0 seconds", () => {
    expect(estimateKcal(0)).toBe(0);
  });
  it("returns 5 for 60 seconds", () => {
    expect(estimateKcal(60)).toBe(5);
  });
  it("returns 30 for 6 minutes", () => {
    expect(estimateKcal(360)).toBe(30);
  });
  it("rounds to integer", () => {
    expect(estimateKcal(30)).toBe(3); // 0.5 min = 2.5 kcal → rounds to 3
  });
});

describe("toPayload", () => {
  it("maps a workout row to health payload", () => {
    const row = {
      id: "w-1",
      startedAt: "2026-05-28T10:00:00Z",
      finishedAt: "2026-05-28T10:45:00Z",
      durationSec: 2700,
      notes: "Hard session",
    } as never;
    const payload = toPayload(row);
    expect(payload).toEqual({
      workoutId: "w-1",
      startedAt: "2026-05-28T10:00:00Z",
      finishedAt: "2026-05-28T10:45:00Z",
      durationSec: 2700,
      totalEnergyKcal: 225,
      exerciseType: "strength_training",
      notes: "Hard session",
    });
  });

  it("falls back to startedAt when finishedAt missing", () => {
    const row = {
      id: "w-2",
      startedAt: "2026-05-28T10:00:00Z",
      finishedAt: null,
      durationSec: 0,
      notes: null,
    } as never;
    const payload = toPayload(row);
    expect(payload.finishedAt).toBe("2026-05-28T10:00:00Z");
    expect(payload.notes).toBeNull();
    expect(payload.totalEnergyKcal).toBe(0);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
pnpm --filter @fitness/mobile vitest run src/lib/health/__tests__/sync.test.ts
```

Expected: FAIL with "Cannot find module '../sync'"

- [ ] **Step 3: Implement sync.ts**

`apps/mobile/src/lib/health/sync.ts`:

```ts
import * as SecureStore from "expo-secure-store";
import { and, eq, isNotNull, lt } from "drizzle-orm";
import { db } from "../../db/client";
import { workouts } from "../../db/schema";
import {
  isHealthAvailable,
  writeWorkoutToHealth,
} from "./index";
import type { HealthWorkoutPayload, HealthSyncSummary } from "./types";
import { HEALTH_OPT_IN_KEY } from "./storage-keys";
import { isHealthSyncFeatureEnabled } from "./feature-flag";

const MAX_ATTEMPTS = 3;

export function estimateKcal(durationSec: number): number {
  return Math.round((durationSec / 60) * 5);
}

export function toPayload(
  w: typeof workouts.$inferSelect,
): HealthWorkoutPayload {
  return {
    workoutId: w.id,
    startedAt: w.startedAt,
    finishedAt: w.finishedAt ?? w.startedAt,
    durationSec: w.durationSec,
    totalEnergyKcal: estimateKcal(w.durationSec),
    exerciseType: "strength_training",
    notes: w.notes,
  };
}

async function isOptInActive(): Promise<boolean> {
  const optIn = await SecureStore.getItemAsync(HEALTH_OPT_IN_KEY).catch(
    () => null,
  );
  return optIn === "true";
}

export async function attemptHealthWriteAsync(
  workoutId: string,
): Promise<void> {
  if (!(await isHealthSyncFeatureEnabled())) return;
  if (!(await isOptInActive())) return;
  if (!(await isHealthAvailable())) return;

  const row = db
    .select()
    .from(workouts)
    .where(eq(workouts.id, workoutId))
    .all()[0];
  if (!row || row.healthSynced === 1) return;
  if (row.healthAttempts >= MAX_ATTEMPTS) return;
  if (!row.finishedAt) return;

  const result = await writeWorkoutToHealth(toPayload(row));
  const now = new Date().toISOString();

  if (result.ok) {
    db.update(workouts)
      .set({
        healthSynced: 1,
        healthUuid: result.recordId,
        updatedAt: now,
      })
      .where(eq(workouts.id, workoutId))
      .run();
  } else {
    db.update(workouts)
      .set({
        healthAttempts: row.healthAttempts + 1,
        updatedAt: now,
      })
      .where(eq(workouts.id, workoutId))
      .run();
    console.warn("Health write failed:", result.error);
  }
}

export async function syncPendingHealthWorkouts(): Promise<HealthSyncSummary> {
  if (!(await isHealthSyncFeatureEnabled())) {
    return { total: 0, synced: 0, failed: 0 };
  }
  if (!(await isOptInActive())) {
    return { total: 0, synced: 0, failed: 0 };
  }
  if (!(await isHealthAvailable())) {
    return { total: 0, synced: 0, failed: 0 };
  }

  const pending = db
    .select()
    .from(workouts)
    .where(
      and(
        eq(workouts.healthSynced, 0),
        isNotNull(workouts.finishedAt),
        lt(workouts.healthAttempts, MAX_ATTEMPTS),
      ),
    )
    .all();

  let synced = 0;
  let failed = 0;
  for (const w of pending) {
    const result = await writeWorkoutToHealth(toPayload(w));
    const now = new Date().toISOString();
    if (result.ok) {
      db.update(workouts)
        .set({
          healthSynced: 1,
          healthUuid: result.recordId,
          updatedAt: now,
        })
        .where(eq(workouts.id, w.id))
        .run();
      synced++;
    } else {
      db.update(workouts)
        .set({
          healthAttempts: w.healthAttempts + 1,
          updatedAt: now,
        })
        .where(eq(workouts.id, w.id))
        .run();
      failed++;
    }
  }
  return { total: pending.length, synced, failed };
}

export function countPendingHealthSync(memberId: string): number {
  return db
    .select()
    .from(workouts)
    .where(
      and(
        eq(workouts.memberId, memberId),
        eq(workouts.healthSynced, 0),
        isNotNull(workouts.finishedAt),
        lt(workouts.healthAttempts, MAX_ATTEMPTS),
      ),
    )
    .all().length;
}

export async function backfillHealthWorkouts(
  memberId: string,
): Promise<{ total: number; synced: number }> {
  if (!(await isHealthSyncFeatureEnabled())) {
    return { total: 0, synced: 0 };
  }
  if (!(await isOptInActive())) {
    return { total: 0, synced: 0 };
  }
  if (!(await isHealthAvailable())) {
    return { total: 0, synced: 0 };
  }

  const all = db
    .select()
    .from(workouts)
    .where(
      and(
        eq(workouts.memberId, memberId),
        eq(workouts.healthSynced, 0),
        isNotNull(workouts.finishedAt),
      ),
    )
    .all();

  let synced = 0;
  for (const w of all) {
    const result = await writeWorkoutToHealth(toPayload(w));
    const now = new Date().toISOString();
    if (result.ok) {
      db.update(workouts)
        .set({
          healthSynced: 1,
          healthUuid: result.recordId,
          healthAttempts: 0,
          updatedAt: now,
        })
        .where(eq(workouts.id, w.id))
        .run();
      synced++;
    } else {
      db.update(workouts)
        .set({
          healthAttempts: w.healthAttempts + 1,
        })
        .where(eq(workouts.id, w.id))
        .run();
    }
  }
  return { total: all.length, synced };
}
```

- [ ] **Step 4: Run tests**

```bash
pnpm --filter @fitness/mobile vitest run src/lib/health/__tests__/sync.test.ts
```

Expected: PASS, 6 tests

- [ ] **Step 5: Typecheck**

```bash
pnpm --filter @fitness/mobile typecheck
```

Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add apps/mobile/src/lib/health/sync.ts apps/mobile/src/lib/health/__tests__/sync.test.ts
git commit -m "feat(mobile): health sync engine + 6 tests

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 11: HealthStatusBadge component

**Files:**
- Create: `apps/mobile/src/components/HealthStatusBadge.tsx`

- [ ] **Step 1: Write component**

`apps/mobile/src/components/HealthStatusBadge.tsx`:

```tsx
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { tokens } from "../theme/tokens";

export type HealthStatus =
  | "not-determined"
  | "requesting"
  | "granted"
  | "granted-paused"
  | "denied"
  | "unavailable";

type Props = { status: HealthStatus };

const STATUS_LABEL: Record<HealthStatus, { label: string; bg: string; fg: string }> = {
  "not-determined": { label: "TAP TO ENABLE", bg: "#eceff1", fg: "#546e7a" },
  "requesting": { label: "REQUESTING…", bg: "#fff8e1", fg: "#8a6d3b" },
  "granted": { label: "GRANTED", bg: "#e8f5e9", fg: "#2e7d32" },
  "granted-paused": { label: "PAUSED", bg: "#fff8e1", fg: "#8a6d3b" },
  "denied": { label: "DENIED", bg: "#ffebee", fg: "#c62828" },
  "unavailable": { label: "NOT SUPPORTED", bg: "#eceff1", fg: "#546e7a" },
};

export function HealthStatusBadge({ status }: Props) {
  const s = STATUS_LABEL[status];
  return (
    <View style={[styles.badge, { backgroundColor: s.bg }]}>
      <Text style={[styles.label, { color: s.fg }]}>{s.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    alignSelf: "flex-start",
  },
  label: {
    fontFamily: tokens.font.sansExtrabold,
    fontSize: 9,
    letterSpacing: 0.6,
  },
});
```

- [ ] **Step 2: Typecheck**

```bash
pnpm --filter @fitness/mobile typecheck
```

Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add apps/mobile/src/components/HealthStatusBadge.tsx
git commit -m "feat(mobile): HealthStatusBadge component

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 12: HealthPermissionPrompt + Backfill + Disconnect modals

**Files:**
- Create: `apps/mobile/src/components/HealthPermissionPrompt.tsx`
- Create: `apps/mobile/src/components/HealthBackfillPrompt.tsx`
- Create: `apps/mobile/src/components/HealthDisconnectPrompt.tsx`

- [ ] **Step 1: HealthPermissionPrompt**

`apps/mobile/src/components/HealthPermissionPrompt.tsx`:

```tsx
import React from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { tokens } from "../theme/tokens";
import { useTheme } from "../lib/theme-provider";

type Props = {
  visible: boolean;
  platformLabel: string;
  onContinue: () => void;
  onCancel: () => void;
};

export function HealthPermissionPrompt({
  visible,
  platformLabel,
  onContinue,
  onCancel,
}: Props) {
  const theme = useTheme();
  return (
    <Modal visible={visible} animationType="fade" transparent>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title}>Connect to {platformLabel}</Text>
          <Text style={styles.body}>
            We&apos;ll save your gym workouts to {platformLabel} so they appear
            in your fitness summary.{"\n\n"}
            We only WRITE workout sessions. We don&apos;t read your health data.
          </Text>
          <View style={styles.actions}>
            <Pressable onPress={onCancel} style={styles.cancelBtn}>
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
            <Pressable
              onPress={onContinue}
              style={[styles.continueBtn, { backgroundColor: theme.accent }]}
            >
              <Text style={styles.continueText}>Continue</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  card: {
    backgroundColor: tokens.color.surface,
    borderRadius: 14,
    padding: 20,
    width: "100%",
    maxWidth: 360,
  },
  title: {
    fontFamily: tokens.font.sansExtrabold,
    fontSize: 18,
    color: tokens.color.fg,
    marginBottom: 12,
  },
  body: {
    fontFamily: tokens.font.sansRegular,
    fontSize: 14,
    color: tokens.color.fgMuted,
    lineHeight: 20,
    marginBottom: 20,
  },
  actions: { flexDirection: "row", gap: 8 },
  cancelBtn: {
    flex: 1,
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
    backgroundColor: tokens.color.bg,
  },
  cancelText: { fontFamily: tokens.font.sansBold, fontSize: 14, color: tokens.color.fgMuted },
  continueBtn: {
    flex: 1,
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  continueText: { color: "white", fontFamily: tokens.font.sansExtrabold, fontSize: 14 },
});
```

- [ ] **Step 2: HealthBackfillPrompt**

`apps/mobile/src/components/HealthBackfillPrompt.tsx`:

```tsx
import React from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { tokens } from "../theme/tokens";
import { useTheme } from "../lib/theme-provider";

type Props = {
  visible: boolean;
  count: number;
  platformLabel: string;
  onConfirm: () => void;
  onSkip: () => void;
};

export function HealthBackfillPrompt({
  visible,
  count,
  platformLabel,
  onConfirm,
  onSkip,
}: Props) {
  const theme = useTheme();
  return (
    <Modal visible={visible} animationType="fade" transparent>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title}>Backfill past workouts?</Text>
          <Text style={styles.body}>
            You have {count} past workouts. Would you like to add them to{" "}
            {platformLabel} now?
          </Text>
          <Pressable
            onPress={onConfirm}
            style={[styles.confirmBtn, { backgroundColor: theme.accent }]}
          >
            <Text style={styles.confirmText}>
              Sync {count} workout{count === 1 ? "" : "s"}
            </Text>
          </Pressable>
          <Pressable onPress={onSkip} style={styles.skipBtn}>
            <Text style={styles.skipText}>Skip</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  card: {
    backgroundColor: tokens.color.surface,
    borderRadius: 14,
    padding: 20,
    width: "100%",
    maxWidth: 360,
  },
  title: {
    fontFamily: tokens.font.sansExtrabold,
    fontSize: 18,
    color: tokens.color.fg,
    marginBottom: 12,
  },
  body: {
    fontFamily: tokens.font.sansRegular,
    fontSize: 14,
    color: tokens.color.fgMuted,
    lineHeight: 20,
    marginBottom: 20,
  },
  confirmBtn: {
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 8,
  },
  confirmText: { color: "white", fontFamily: tokens.font.sansExtrabold, fontSize: 14 },
  skipBtn: { padding: 12, alignItems: "center" },
  skipText: { fontFamily: tokens.font.sansBold, fontSize: 13, color: tokens.color.fgMuted },
});
```

- [ ] **Step 3: HealthDisconnectPrompt**

`apps/mobile/src/components/HealthDisconnectPrompt.tsx`:

```tsx
import React from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { tokens } from "../theme/tokens";

type Props = {
  visible: boolean;
  platformLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
};

export function HealthDisconnectPrompt({
  visible,
  platformLabel,
  onConfirm,
  onCancel,
}: Props) {
  return (
    <Modal visible={visible} animationType="fade" transparent>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title}>Disconnect {platformLabel}?</Text>
          <Text style={styles.body}>
            Future workouts won&apos;t be saved to {platformLabel}. Workouts
            already saved will stay.{"\n\n"}
            To remove past data: open {platformLabel} &gt; Sources &gt; FitClub.
          </Text>
          <View style={styles.actions}>
            <Pressable onPress={onCancel} style={styles.cancelBtn}>
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
            <Pressable onPress={onConfirm} style={styles.disconnectBtn}>
              <Text style={styles.disconnectText}>Disconnect</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  card: {
    backgroundColor: tokens.color.surface,
    borderRadius: 14,
    padding: 20,
    width: "100%",
    maxWidth: 360,
  },
  title: {
    fontFamily: tokens.font.sansExtrabold,
    fontSize: 18,
    color: tokens.color.fg,
    marginBottom: 12,
  },
  body: {
    fontFamily: tokens.font.sansRegular,
    fontSize: 14,
    color: tokens.color.fgMuted,
    lineHeight: 20,
    marginBottom: 20,
  },
  actions: { flexDirection: "row", gap: 8 },
  cancelBtn: {
    flex: 1,
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
    backgroundColor: tokens.color.bg,
  },
  cancelText: { fontFamily: tokens.font.sansBold, fontSize: 14, color: tokens.color.fgMuted },
  disconnectBtn: {
    flex: 1,
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
    backgroundColor: "#c62828",
  },
  disconnectText: { color: "white", fontFamily: tokens.font.sansExtrabold, fontSize: 14 },
});
```

- [ ] **Step 4: Typecheck**

```bash
pnpm --filter @fitness/mobile typecheck
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/mobile/src/components/HealthPermissionPrompt.tsx apps/mobile/src/components/HealthBackfillPrompt.tsx apps/mobile/src/components/HealthDisconnectPrompt.tsx
git commit -m "feat(mobile): health permission + backfill + disconnect modals

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 13: Health Integrations screen

**Files:**
- Create: `apps/mobile/src/app/health-integrations.tsx`

- [ ] **Step 1: Write screen**

`apps/mobile/src/app/health-integrations.tsx`:

```tsx
import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { useFocusEffect } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { BackButton } from "../components/BackButton";
import { ScreenContainer } from "../components/ScreenContainer";
import {
  HealthStatusBadge,
  type HealthStatus,
} from "../components/HealthStatusBadge";
import { HealthPermissionPrompt } from "../components/HealthPermissionPrompt";
import { HealthBackfillPrompt } from "../components/HealthBackfillPrompt";
import { HealthDisconnectPrompt } from "../components/HealthDisconnectPrompt";
import { tokens } from "../theme/tokens";
import { useTheme } from "../lib/theme-provider";
import { useAuth } from "../lib/store";
import {
  isHealthAvailable,
  requestHealthPermission,
} from "../lib/health";
import {
  backfillHealthWorkouts,
  countPendingHealthSync,
  syncPendingHealthWorkouts,
} from "../lib/health/sync";
import { HEALTH_OPT_IN_KEY } from "../lib/health/storage-keys";

const PLATFORM_LABEL = Platform.OS === "ios" ? "Apple Health" : "Health Connect";
const PLATFORM_ICON = Platform.OS === "ios" ? "🏥" : "🩺";

export default function HealthIntegrationsScreen() {
  const theme = useTheme();
  const { member } = useAuth();
  const memberId = member?.dbId ?? "";

  const [available, setAvailable] = useState<boolean | null>(null);
  const [optIn, setOptIn] = useState(false);
  const [status, setStatus] = useState<HealthStatus>("not-determined");
  const [pending, setPending] = useState(0);
  const [showPrePrompt, setShowPrePrompt] = useState(false);
  const [showBackfill, setShowBackfill] = useState(false);
  const [showDisconnect, setShowDisconnect] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [lastResult, setLastResult] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const a = await isHealthAvailable();
    setAvailable(a);
    const stored = await SecureStore.getItemAsync(HEALTH_OPT_IN_KEY).catch(
      () => null,
    );
    const on = stored === "true";
    setOptIn(on);
    if (!a) setStatus("unavailable");
    else if (on) setStatus("granted");
    else setStatus("not-determined");
    if (memberId) setPending(countPendingHealthSync(memberId));
  }, [memberId]);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const onToggle = async (next: boolean) => {
    if (next) {
      if (!available) {
        Alert.alert(
          "Not supported",
          `${PLATFORM_LABEL} is not available on this device.`,
        );
        return;
      }
      setShowPrePrompt(true);
    } else {
      setShowDisconnect(true);
    }
  };

  const onPromptContinue = async () => {
    setShowPrePrompt(false);
    setStatus("requesting");
    const granted = await requestHealthPermission();
    if (granted) {
      await SecureStore.setItemAsync(HEALTH_OPT_IN_KEY, "true");
      setOptIn(true);
      setStatus("granted");
      const count = memberId ? countPendingHealthSync(memberId) : 0;
      setPending(count);
      if (count > 0) setShowBackfill(true);
    } else {
      setStatus("denied");
    }
  };

  const onDisconnect = async () => {
    setShowDisconnect(false);
    await SecureStore.setItemAsync(HEALTH_OPT_IN_KEY, "false");
    setOptIn(false);
    setStatus("granted-paused");
  };

  const onBackfill = async () => {
    setShowBackfill(false);
    if (!memberId) return;
    setSyncing(true);
    const r = await backfillHealthWorkouts(memberId);
    setLastResult(`Backfilled ${r.synced} of ${r.total} workouts.`);
    setPending(countPendingHealthSync(memberId));
    setSyncing(false);
  };

  const onSyncNow = async () => {
    setSyncing(true);
    const r = await syncPendingHealthWorkouts();
    setLastResult(
      `Synced ${r.synced} of ${r.total}. ${r.failed} failed.`,
    );
    if (memberId) setPending(countPendingHealthSync(memberId));
    setSyncing(false);
  };

  return (
    <ScreenContainer padding={20}>
      <BackButton />
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Health Integrations</Text>

        <View style={styles.section}>
          <Text style={styles.platformTitle}>
            {PLATFORM_ICON} {PLATFORM_LABEL}
          </Text>
          <Text style={styles.platformBody}>
            Save your workouts to {PLATFORM_LABEL} automatically.
          </Text>

          <View style={styles.toggleRow}>
            <Text style={styles.toggleLabel}>Sync workouts</Text>
            <Switch
              value={optIn}
              disabled={!available || status === "requesting"}
              onValueChange={onToggle}
              trackColor={{ false: tokens.color.border, true: theme.accent }}
            />
          </View>

          <View style={styles.statusRow}>
            <HealthStatusBadge status={status} />
          </View>

          {status === "denied" && (
            <Pressable
              onPress={() => Linking.openSettings()}
              style={[styles.settingsBtn, { backgroundColor: theme.accent }]}
            >
              <Text style={styles.settingsBtnText}>Open Settings</Text>
            </Pressable>
          )}
        </View>

        <Text style={styles.sectionHeader}>What we sync</Text>
        <View style={styles.list}>
          <Text style={styles.listItem}>✓ Workout duration</Text>
          <Text style={styles.listItem}>✓ Strength training type</Text>
          <Text style={styles.listItem}>✓ Estimated calories</Text>
          <Text style={[styles.listItem, styles.listItemMuted]}>
            ✗ Heart rate (not yet)
          </Text>
          <Text style={[styles.listItem, styles.listItemMuted]}>
            ✗ Weight (not yet)
          </Text>
        </View>

        <Text style={styles.sectionHeader}>Manual sync</Text>
        <Text style={styles.pendingText}>
          {pending} workout{pending === 1 ? "" : "s"} pending
        </Text>
        <Pressable
          onPress={onSyncNow}
          disabled={!optIn || syncing || pending === 0}
          style={[
            styles.syncBtn,
            { backgroundColor: theme.accent },
            (!optIn || syncing || pending === 0) && { opacity: 0.4 },
          ]}
        >
          <Text style={styles.syncBtnText}>
            {syncing ? "Syncing…" : "Sync now"}
          </Text>
        </Pressable>
        {lastResult && <Text style={styles.lastResult}>{lastResult}</Text>}

        <Text style={styles.sectionHeader}>Privacy</Text>
        <Text style={styles.privacy}>
          Your data stays on your device except the workout summary we already
          store on our server.
        </Text>
      </ScrollView>

      <HealthPermissionPrompt
        visible={showPrePrompt}
        platformLabel={PLATFORM_LABEL}
        onContinue={onPromptContinue}
        onCancel={() => setShowPrePrompt(false)}
      />
      <HealthBackfillPrompt
        visible={showBackfill}
        count={pending}
        platformLabel={PLATFORM_LABEL}
        onConfirm={onBackfill}
        onSkip={() => setShowBackfill(false)}
      />
      <HealthDisconnectPrompt
        visible={showDisconnect}
        platformLabel={PLATFORM_LABEL}
        onConfirm={onDisconnect}
        onCancel={() => setShowDisconnect(false)}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: {
    fontFamily: tokens.font.sansExtrabold,
    fontSize: 24,
    color: tokens.color.fg,
    marginVertical: 8,
  },
  section: {
    backgroundColor: tokens.color.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: tokens.color.border,
    marginBottom: 20,
  },
  platformTitle: {
    fontFamily: tokens.font.sansExtrabold,
    fontSize: 16,
    color: tokens.color.fg,
  },
  platformBody: {
    fontFamily: tokens.font.sansRegular,
    fontSize: 13,
    color: tokens.color.fgMuted,
    marginTop: 4,
    marginBottom: 16,
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  toggleLabel: { fontFamily: tokens.font.sansBold, fontSize: 14, color: tokens.color.fg },
  statusRow: { marginBottom: 8 },
  settingsBtn: {
    marginTop: 12,
    padding: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  settingsBtnText: { color: "white", fontFamily: tokens.font.sansBold, fontSize: 13 },
  sectionHeader: {
    fontFamily: tokens.font.sansExtrabold,
    fontSize: 11,
    color: tokens.color.fgMuted,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginTop: 8,
    marginBottom: 8,
  },
  list: { marginBottom: 20 },
  listItem: {
    fontFamily: tokens.font.sansRegular,
    fontSize: 13,
    color: tokens.color.fg,
    paddingVertical: 4,
  },
  listItemMuted: { color: tokens.color.fgMuted },
  pendingText: {
    fontFamily: tokens.font.sansMedium,
    fontSize: 13,
    color: tokens.color.fgMuted,
    marginBottom: 10,
  },
  syncBtn: {
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  syncBtnText: { color: "white", fontFamily: tokens.font.sansExtrabold, fontSize: 14 },
  lastResult: {
    fontFamily: tokens.font.sansRegular,
    fontSize: 12,
    color: tokens.color.fgMuted,
    marginTop: 8,
    textAlign: "center",
  },
  privacy: {
    fontFamily: tokens.font.sansRegular,
    fontSize: 13,
    color: tokens.color.fgMuted,
    lineHeight: 18,
    marginBottom: 32,
  },
});
```

- [ ] **Step 2: Typecheck**

```bash
pnpm --filter @fitness/mobile typecheck
```

Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add apps/mobile/src/app/health-integrations.tsx
git commit -m "feat(mobile): /health-integrations settings screen

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 14: Profile row entry

**Files:**
- Modify: `apps/mobile/src/app/(tabs)/profile.tsx`

- [ ] **Step 1: Add Health Integrations row to Account section**

Edit `apps/mobile/src/app/(tabs)/profile.tsx`. Locate the "Account" section (or the section listing Settings / Privacy / Sign out links). Add a Pressable row above "Sign out":

```tsx
<Pressable
  onPress={() => router.push("/health-integrations" as Parameters<typeof router.push>[0])}
  style={styles.accountRow}
>
  <Text style={styles.accountRowLabel}>Health Integrations</Text>
  <Text style={styles.accountRowChevron}>›</Text>
</Pressable>
```

If the file has a different style naming convention for account rows (e.g. `styles.menuRow` instead of `styles.accountRow`), reuse the existing pattern. Goal: visual parity with sibling rows.

- [ ] **Step 2: Typecheck**

```bash
pnpm --filter @fitness/mobile typecheck
```

Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add "apps/mobile/src/app/(tabs)/profile.tsx"
git commit -m "feat(mobile): Profile -> Health Integrations row

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 15: Register Stack screen + AppState listener

**Files:**
- Modify: `apps/mobile/src/app/_layout.tsx`

- [ ] **Step 1: Register Stack.Screen**

Edit `apps/mobile/src/app/_layout.tsx`. Inside the existing `<Stack>` block, add:

```tsx
<Stack.Screen name="health-integrations" options={{ headerShown: false }} />
```

Place it alongside other top-level screens (e.g. near `train/*` or `(auth)/*` entries).

- [ ] **Step 2: Add AppState foreground listener**

At the top of `_layout.tsx`, add the import:

```tsx
import { AppState } from "react-native";
import { syncPendingHealthWorkouts } from "../lib/health/sync";
```

Inside the root layout component body, add a useEffect for the listener:

```tsx
useEffect(() => {
  const sub = AppState.addEventListener("change", (state) => {
    if (state === "active") {
      void syncPendingHealthWorkouts();
    }
  });
  return () => sub.remove();
}, []);
```

Ensure `useEffect` is imported from React.

- [ ] **Step 3: Typecheck**

```bash
pnpm --filter @fitness/mobile typecheck
```

Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add apps/mobile/src/app/_layout.tsx
git commit -m "feat(mobile): register health-integrations screen + AppState foreground sync

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 16: session-store finishWorkout hook

**Files:**
- Modify: `apps/mobile/src/workout/session-store.tsx`

- [ ] **Step 1: Add import**

Edit `apps/mobile/src/workout/session-store.tsx`. Near the existing imports add:

```tsx
import { attemptHealthWriteAsync } from "../lib/health/sync";
```

- [ ] **Step 2: Hook into finishWorkout**

Locate `finishWorkout = useCallback(...)`. Inside the function, AFTER all existing finalize logic (workout update, completion writes, etc.) and BEFORE the `return workoutId;` statement, add:

```tsx
// Push to Apple Health / Health Connect if user opted in (fire-and-forget)
void attemptHealthWriteAsync(workoutId);
```

The `void` is critical — it intentionally doesn't `await` to keep finishWorkout fast.

- [ ] **Step 3: Typecheck + tests**

```bash
pnpm --filter @fitness/mobile typecheck
pnpm --filter @fitness/mobile test
```

Expected: PASS (existing tests should still pass; mocked db chain doesn't trip)

- [ ] **Step 4: Commit**

```bash
git add apps/mobile/src/workout/session-store.tsx
git commit -m "feat(mobile): finishWorkout fire-and-forget health write

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 17: Repo verification

**Files:** none (verification only)

- [ ] **Step 1: Full typecheck**

```bash
pnpm -r typecheck
```

Expected: PASS for all 5 workspace packages.

- [ ] **Step 2: Full test suite**

```bash
pnpm -r test
```

Expected: PASS — new tests:
- `@fitness/mobile`: `lib/health/__tests__/sync.test.ts` (6 tests)

Total mobile tests should be ~24+.

- [ ] **Step 3: Audit env binding (no regression from MT)**

```bash
grep -rn "EXPO_PUBLIC_TENANT_ID" apps/mobile/src/
```

Expected: 0 hits.

- [ ] **Step 4: No commit**

Verification only.

---

## Task 18: VPS deploy — Postgres migration

**Files:** none in repo (operational)

- [ ] **Step 1: Merge branch to main + push**

```bash
git checkout main
git merge feat/health-integration --ff-only
git push origin main
git push origin feat/health-integration
```

- [ ] **Step 2: VPS pull**

```bash
ssh root@100.67.196.22 'cd /srv/fitclub-os && git fetch origin main && git reset --hard origin/main && git log --oneline -1'
```

Expected: latest commit SHA matching local main.

- [ ] **Step 3: Run drizzle migration**

```bash
ssh root@100.67.196.22 'cd /srv/fitclub-os && docker run --rm --network supabase_default -v $(pwd):/work -w /work/packages/db -e DATABASE_URL="postgres://postgres:a844f79436e19a92cca6e7cb96e9c930f6f97b3a505b7bc9@db:5432/postgres" node:20 sh -c "npm install --silent --no-audit --no-fund drizzle-kit drizzle-orm postgres dotenv 2>&1 | tail -2 && npx drizzle-kit migrate"' 2>&1 | tail -10
```

Expected: `[✓] migrations applied successfully!`

- [ ] **Step 4: Revert package.json mutation**

```bash
ssh root@100.67.196.22 'cd /srv/fitclub-os && git checkout -- packages/db/package.json && rm -rf packages/db/node_modules packages/db/package-lock.json'
```

- [ ] **Step 5: Verify columns**

```bash
ssh root@100.67.196.22 "docker exec supabase-db psql -U postgres -d postgres -c \"SELECT column_name FROM information_schema.columns WHERE table_name = 'workouts' AND column_name LIKE 'health_%' ORDER BY column_name\""
```

Expected: 3 rows — `health_attempts`, `health_synced`, `health_uuid`.

- [ ] **Step 6: No commit**

Operational only.

---

## Task 19: EAS dev client build (iOS)

**Files:** none in repo (operational)

- [ ] **Step 1: Enable HealthKit capability in Apple Developer Portal**

User-side action (manual):
1. Sign in at https://developer.apple.com
2. Certificates, IDs & Profiles → Identifiers
3. Locate the FitClub app identifier (matches `apps/mobile/app.json` `ios.bundleIdentifier`)
4. Click → scroll to "Capabilities" → toggle ON **HealthKit**
5. Save

EAS picks up the new entitlement on the next iOS build (will regenerate provisioning profile automatically with `--auto-submit-with-profile` or interactive prompt).

- [ ] **Step 2: Run EAS development build (iOS)**

```bash
cd apps/mobile
npx eas build --profile development --platform ios
```

Expected: builds queued on EAS servers (~10-15 min). Output ends with a TestFlight link or QR install link.

- [ ] **Step 3: Install dev client on test device**

User-side action:
1. Open the install link from EAS Build output on the test iPhone
2. Install profile + app
3. Launch FitClub dev client

- [ ] **Step 4: Connect Metro tunnel**

```bash
cd apps/mobile
npx expo start --dev-client --tunnel
```

Expected: tunnel URL printed. Open dev client on iPhone → tap "Enter URL manually" or scan QR.

- [ ] **Step 5: No commit**

Operational only.

---

## Task 20: EAS dev client build (Android)

**Files:** none in repo (operational)

- [ ] **Step 1: Run EAS development build (Android)**

```bash
cd apps/mobile
npx eas build --profile development --platform android
```

Expected: build queued (~5-10 min). Output: APK install URL.

- [ ] **Step 2: Install on test device**

User-side action:
1. Open install URL on Android device
2. Enable "Install from unknown sources" if prompted
3. Install APK

- [ ] **Step 3: Verify Health Connect installed**

On Android 14+: Health Connect is built into Settings. On Android 13: install from Play Store.

```
adb shell pm list packages | grep healthconnect
```

(If `adb` is unavailable, manually verify by opening Settings → Apps → Health Connect.)

- [ ] **Step 4: Connect Metro tunnel**

Use same Metro tunnel from Task 19 step 4. Open Android dev client → scan QR.

- [ ] **Step 5: No commit**

Operational only.

---

## Task 21: Real device testing

**Files:** none

- [ ] **Step 1: iOS test flow**

On iOS dev client:
1. Sign in via OTP
2. Profile → Health Integrations
3. Toggle ON → pre-prompt modal appears
4. Tap Continue → native iOS Health permission sheet
5. Grant Write access for Workout + Active Energy
6. Status badge shows "GRANTED"
7. If backfill prompt appears, tap Skip (test backfill separately)
8. Go to Train tab → Quick workout → finish a 5-minute workout
9. Open Apple Health → Browse → Workouts → Today
10. Verify: "Functional Strength Training, FitClub, ~5 min" entry visible

- [ ] **Step 2: iOS toggle off**

1. Back to Health Integrations
2. Toggle OFF → disconnect confirm modal
3. Tap Disconnect → status changes to "PAUSED"
4. Finish another workout
5. Verify in Apple Health: only the original workout, no new entry

- [ ] **Step 3: iOS permission revoke**

1. Open iOS Settings → Privacy & Security → Health → FitClub
2. Toggle off Workout write
3. Toggle Health Integrations ON in app
4. Finish workout → write fails silently
5. After 3 failures, status badge shows "DENIED" with Open Settings button

- [ ] **Step 4: Android test flow**

1. Sign in via OTP
2. Profile → Health Integrations
3. Toggle ON → pre-prompt → Continue → Health Connect permission UI
4. Grant Write Exercise + Active Calories
5. Status "GRANTED"
6. Train tab → finish workout
7. Open Health Connect → Browse data → Exercise → verify entry

- [ ] **Step 5: Manual sync test**

1. Toggle ON in iOS
2. Without granting (cancel native prompt), state goes to DENIED
3. Re-grant via iOS Settings
4. Open Health Integrations → "Sync now" → verify pending workouts batch-write

- [ ] **Step 6: No commit (test only)**

Operational only.

---

## Task 22: EAS production build + App Store submit

**Files:** none

- [ ] **Step 1: Update Apple App Store Connect privacy info**

User-side action:
1. App Store Connect → FitClub → App Privacy
2. Click "Edit" on data types
3. Add: "Health & Fitness" → "Workout Sessions"
4. Mark: "Linked to user" + "Used for App Functionality"
5. Save

- [ ] **Step 2: EAS production build**

```bash
cd apps/mobile
npx eas build --profile production --platform all
```

Expected: build queued, auto-increments iOS buildNumber and Android versionCode.

- [ ] **Step 3: Submit to stores**

```bash
npx eas submit --profile production --platform ios
npx eas submit --profile production --platform android
```

Expected: submission successful. Apple review 1-3 days; Play Store review hours-to-days.

- [ ] **Step 4: Monitor reviews**

- App Store Connect → My Apps → FitClub → TestFlight / Distribution
- Play Console → Apps → FitClub → Release dashboard

Approval triggers automatic phased rollout (per existing release settings).

- [ ] **Step 5: No commit**

Operational only.

---

## Self-Review

**Spec coverage:**

| Spec section | Tasks |
|---|---|
| 1 Architecture | Tasks 5-10 (lib/health structure) |
| 2 Data Mapping + Native Setup | Tasks 1-4 (schema, migration, packages, plugins, EAS) |
| 3 Permission Flow + UI | Tasks 11-13 (badge, modals, screen) |
| 4 Sync + Retry | Tasks 10, 15, 16 (sync engine + AppState listener + finishWorkout hook) |
| 5 Edges + Rollout | Tasks 19-22 (EAS builds, device testing, store submit) |
| 6 File Inventory | All tasks |
| 7 Out of Scope | n/a — excluded |
| 8 Success Criteria | Task 17 (verification) + Task 21 (device testing) + Task 22 (store) |

Coverage complete.

**Placeholder scan:** No "TBD" / "TODO" / vague text. All code blocks complete.

**Type consistency:**
- `HealthWorkoutPayload` defined in Task 5, used in Tasks 6, 7, 10
- `HealthResult` defined in Task 5, returned by Tasks 6, 7
- `HealthSyncSummary` defined in Task 5, returned by Task 10's `syncPendingHealthWorkouts`
- `HEALTH_OPT_IN_KEY` defined in Task 5, used in Tasks 10, 13
- `isHealthAvailable`, `requestHealthPermission`, `writeWorkoutToHealth` defined in Task 8, used in Tasks 10, 13
- `HealthStatus` type defined in Task 11, used by Task 13's screen
- `attemptHealthWriteAsync`, `syncPendingHealthWorkouts`, `countPendingHealthSync`, `backfillHealthWorkouts` defined in Task 10, used in Tasks 13, 15, 16
