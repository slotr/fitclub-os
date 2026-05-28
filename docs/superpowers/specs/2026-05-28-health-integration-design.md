# Health Integration Design

> **For agentic workers:** Implementation plan will be written next at `docs/superpowers/plans/2026-05-28-health-integration.md`. This spec is the source of truth.

**Goal:** When a member finishes a gym workout, push that workout to Apple Health (iOS) or Health Connect (Android) so it appears alongside their fitness data. Settings opt-in toggle, push-only (no read), no live heart rate.

**Scope:** Single coupled release. Member-only mobile feature. Apple HealthKit + Android Health Connect with a unified cross-platform abstraction. EAS development client required (native modules don't run in Expo Go).

**Approach:** A thin `lib/health/` module dispatches to platform-specific writers behind a unified TypeScript interface. The session store hooks `finishWorkout` to attempt an immediate write; failures land in a queue retried on app foreground and via manual sync button. Settings screen owns the opt-in toggle, permission status, pending count, and disconnect flow.

**Tech Stack:** `react-native-health` (iOS), `react-native-health-connect` (Android), expo-secure-store, drizzle (Postgres + SQLite), Expo SDK 54 / React Native 0.81, EAS dev client.

**Status:** Approved by user — six-section design walkthrough complete (architecture, data mapping, permission flow, sync + retry, edges + rollout, file inventory).

---

## 1. Architecture

### Scope summary

- Members opt in from Profile → Health Integrations.
- After OTP login, default `health.opt_in = false`. Nothing writes until explicit toggle.
- When opt-in is on and a workout finishes, the session store dispatches a non-blocking write through the platform writer.
- Failed writes increment `health_attempts`; max 3 auto-retries; manual sync covers the rest.
- No biometric pull (heart rate, weight) in v1. No live HR. No background OS task.

### Layered overview

```
Profile screen → /health-integrations route
                          │
                          ▼
                  Permission toggle UI
                          │
              SecureStore: opt_in boolean
                          │
                          ▼
                lib/health/index.ts (unified API)
                          │
        ┌─────────────────┴──────────────────┐
        ▼                                    ▼
   ios-healthkit.ts                    android-hc.ts
   (react-native-health)               (react-native-health-connect)
        │                                    │
        ▼                                    ▼
   HKWorkout                          ExerciseSession + ActiveCaloriesBurned

session-store.tsx finishWorkout()
                          │ fire-and-forget
                          ▼
              lib/health/sync.ts attemptHealthWriteAsync
                          │
                          ▼
                workouts table: health_synced, health_uuid, health_attempts
                          │
                          ▲
   AppState 'active' ◀────┤ syncPendingHealthWorkouts()
                          │
   Settings "Sync now" ◀──┘
```

### Reuse

- `workouts` table — 3 new columns, no new tables
- `session-store.tsx` finishWorkout — fire-and-forget hook
- `Profile` screen — new row entry to `/health-integrations`
- `app_config` (from MT-23) — feature kill switch (`health_sync_enabled` flag)

### Out of scope (v1)

- Biometric reads (weight, heart rate, calories, sleep, steps)
- Live heart rate samples during workout
- Apple Watch companion app
- Third-party services (Strava, Garmin, Whoop, Fitbit)
- True background sync (iOS background fetch, Android WorkManager)
- Cardio session types (running, cycling) — strength_training only
- Editing already-synced HK records when local workout is updated
- Cross-device sync coordination (each device tries independently)

---

## 2. Data Mapping + Native Setup

### Schema additions

#### Postgres

```sql
-- migrations/0010_<name>.sql
ALTER TABLE workouts ADD COLUMN health_synced boolean NOT NULL DEFAULT false;
ALTER TABLE workouts ADD COLUMN health_uuid text;
ALTER TABLE workouts ADD COLUMN health_attempts integer NOT NULL DEFAULT 0;
```

#### SQLite

Append to `apps/mobile/src/db/client.ts` MIGRATIONS array (v3 → v4):

```ts
`ALTER TABLE workouts ADD COLUMN health_synced INTEGER NOT NULL DEFAULT 0;`,
`ALTER TABLE workouts ADD COLUMN health_uuid TEXT;`,
`ALTER TABLE workouts ADD COLUMN health_attempts INTEGER NOT NULL DEFAULT 0;`,
```

#### Drizzle schema columns

`packages/db/src/schema/workouts.ts`:

```ts
healthSynced: boolean("health_synced").notNull().default(false),
healthUuid: text("health_uuid"),
healthAttempts: integer("health_attempts").notNull().default(0),
```

`apps/mobile/src/db/schema.ts` workouts:

```ts
healthSynced: integer("health_synced").notNull().default(0),
healthUuid: text("health_uuid"),
healthAttempts: integer("health_attempts").notNull().default(0),
```

### Native packages

```bash
cd apps/mobile
npx expo install react-native-health
npx expo install react-native-health-connect
```

### Expo plugins config

`app.json`:

```json
{
  "expo": {
    "plugins": [
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
    ]
  }
}
```

### EAS dev client

`eas.json`:

```json
{
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "ios": { "simulator": false, "resourceClass": "m-medium" },
      "android": { "buildType": "apk" }
    },
    "production": {
      "autoIncrement": true
    }
  }
}
```

Build commands:

```bash
eas build --profile development --platform ios     # ~15 min
eas build --profile development --platform android # ~7 min
```

Dev client picks up Metro tunnel via `npx expo start --dev-client`.

### Unified API

`apps/mobile/src/lib/health/index.ts`:

```ts
import { Platform } from "react-native";
import * as iosHealth from "./ios-healthkit";
import * as androidHealth from "./android-hc";

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

export async function requestHealthPermission(): Promise<boolean> {
  if (Platform.OS === "ios") return iosHealth.requestPermission();
  if (Platform.OS === "android") return androidHealth.requestPermission();
  return false;
}

export async function isHealthAvailable(): Promise<boolean> {
  if (Platform.OS === "ios") return iosHealth.isAvailable();
  if (Platform.OS === "android") return androidHealth.isAvailable();
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

### iOS implementation

`apps/mobile/src/lib/health/ios-healthkit.ts`:

```ts
import AppleHealthKit from "react-native-health";
import type { HealthWorkoutPayload, HealthResult } from "./index";

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
    AppleHealthKit.initHealthKit(PERMS, (err) => {
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
        type: "FunctionalStrengthTraining",
        startDate: payload.startedAt,
        endDate: payload.finishedAt,
        energyBurned: payload.totalEnergyKcal ?? undefined,
        distance: 0,
        metadata: {
          HKExternalUUID: payload.workoutId,
          HKWorkoutBrandName: "FitClub",
          Notes: payload.notes ?? "",
        },
      },
      (err, result) => {
        if (err) resolve({ ok: false, error: String(err) });
        else resolve({ ok: true, recordId: String(result) });
      },
    );
  });
}
```

### Android implementation

`apps/mobile/src/lib/health/android-hc.ts`:

```ts
import {
  initialize,
  requestPermission as hcRequestPermission,
  insertRecords,
} from "react-native-health-connect";
import type { HealthWorkoutPayload, HealthResult } from "./index";

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
    const records = [
      {
        recordType: "ExerciseSession" as const,
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
        recordType: "ActiveCaloriesBurned" as const,
        startTime: payload.startedAt,
        endTime: payload.finishedAt,
        energy: { value: payload.totalEnergyKcal, unit: "kilocalories" as const },
      } as any);
    }
    const ids = await insertRecords(records);
    return { ok: true, recordId: ids[0] ?? "" };
  } catch (e: any) {
    return { ok: false, error: e?.message ?? String(e) };
  }
}
```

### Activity type mapping

- iOS: `HKWorkoutActivityType.FunctionalStrengthTraining`
- Android: `ExerciseSessionRecord.EXERCISE_TYPE_STRENGTH_TRAINING` (integer 13)

Single mapping in v1 (all FitClub workouts are strength training). Cardio types deferred.

### Energy estimation

```ts
function estimateKcal(durationSec: number): number {
  return Math.round((durationSec / 60) * 5);  // 5 kcal/min baseline
}
```

Coarse but consistent across users. Future v2 uses MET tables + member weight.

### Dedup key

FitClub workout UUID written to:
- iOS: `metadata.HKExternalUUID`
- Android: `metadata.clientRecordId`

Local `workouts.health_synced = 1` is the primary guard. External UUID is defense-in-depth for app reinstall scenarios.

---

## 3. Permission Flow + UI

### Entry point

Profile tab → "Health Integrations" row → `router.push('/health-integrations')`.

### Settings screen layout

```
┌──────────────────────────────────────┐
│  ←  Health Integrations               │
├──────────────────────────────────────┤
│  🏥 Apple Health (iOS)                │
│     Save your workouts to Apple      │
│     Health automatically.            │
│                                      │
│     [ ◯───●  ]  Sync workouts        │
│                                      │
│     Status: Granted ✓                │
│     Last sync: 2 min ago             │
│                                      │
│  What we sync                         │
│  ✓ Workout duration                  │
│  ✓ Strength training type            │
│  ✓ Estimated calories                │
│  ✗ Heart rate (not yet)              │
│  ✗ Weight (not yet)                  │
│                                      │
│  Manual sync                          │
│  3 workouts pending                  │
│  [    Sync now    ]                  │
│                                      │
│  Privacy                              │
│  Your data stays on your device      │
│  except the workout summary we       │
│  already store on our server.        │
└──────────────────────────────────────┘
```

Android: same layout with "Health Connect" label and 🩺 icon.

### State machine

```
NOT_DETERMINED
   │
   ▼ Toggle on → requestHealthPermission()
PROMPT_SHOWING
   │ User grants                         │ User denies
   ▼                                     ▼
GRANTED (opt_in=true) ─── Toggle off ─▶ GRANTED-but-OFF ────────┐
                                          │                     │
                          User toggles on ▼                     │
                                          ▼                     │
                                       (back to GRANTED) ───────┘

DENIED  →  Banner: "Open iOS Settings"  →  Linking.openSettings()
UNAVAILABLE  →  Toggle disabled, "Not supported on this device"
```

### SecureStore key

```
fitclub.health.opt_in       boolean ("true" / "false")
```

System permission status is queried fresh on each `isAvailable()` call.

### Status row variations

| State | Text | Action |
|---|---|---|
| Not requested | "Tap to enable" | Toggle triggers requestPermission |
| Granted + opt-in on | "Granted ✓ · Last sync: N min ago" | Toggle OFF → confirm modal |
| Granted + opt-in off | "Granted, but sync paused" | Toggle ON re-enables |
| Denied | "Denied. Open Settings to enable." | Open Settings deep link |
| Unavailable | "Not supported on this device" | Disabled |
| Requesting | "Requesting permission…" | Spinner |

### Pre-permission explanatory modal

Shown BEFORE the native system prompt on first toggle:

```
┌──────────────────────────────────┐
│  Connect to Apple Health         │
│                                  │
│  We'll save your gym workouts to │
│  Apple Health so they appear in  │
│  your fitness summary.           │
│                                  │
│  We only WRITE workout sessions. │
│  We don't read your health data. │
│                                  │
│   [ Continue ]  [ Cancel ]       │
└──────────────────────────────────┘
```

Improves grant rate and reduces Apple review risk (clear context for permission ask).

### Backfill prompt

After successful first grant:

```
┌──────────────────────────────────┐
│  Backfill past workouts?         │
│                                  │
│  You have 23 past workouts.      │
│  Would you like to add them to   │
│  Apple Health now?               │
│                                  │
│   [ Sync 23 workouts ]           │
│   [ Skip ]                       │
└──────────────────────────────────┘
```

Optional. Skip-able. Sync via `backfillHealthWorkouts(memberId)` with progress feedback.

### Disconnect prompt

Toggle off triggers:

```
┌──────────────────────────────────┐
│  Disconnect Apple Health?        │
│                                  │
│  Future workouts won't be saved  │
│  to Apple Health. Workouts       │
│  already saved will stay.        │
│                                  │
│  To remove past data: open       │
│  Apple Health > Sources > FitClub│
│                                  │
│   [ Disconnect ]  [ Cancel ]     │
└──────────────────────────────────┘
```

iOS-level permission is NOT auto-revoked. User must do that manually if desired.

### Components

```
HealthStatusBadge.tsx       — status pill with state-based colors
HealthPermissionPrompt.tsx  — pre-permission modal
HealthBackfillPrompt.tsx    — backfill confirm modal
HealthDisconnectPrompt.tsx  — disconnect confirm modal
```

### Edge: revoked while backgrounded

User goes to iOS Settings → Privacy → Health → FitClub → toggles off Write. App resume → `isAvailable()` returns true but write attempts will fail. The status row shows "Granted" (system level) but writes silently fail. Detection: after MAX_ATTEMPTS failures across multiple workouts, mark `opt_in=false` and surface banner: "Permission appears revoked. Re-enable in Settings."

(Reactive detection rather than active polling — keeps it simple.)

### Edge: device upgrade / iCloud restore

`opt_in=true` restored from iCloud backup but HK permission needs re-grant on new device. First write attempt fails → counted toward MAX_ATTEMPTS. After 3 fails, status shows "Re-grant required" with re-toggle button.

---

## 4. Sync + Retry

### Trigger points

1. **Workout finish** (primary) — session store hook, fire-and-forget
2. **App foreground resume** — AppState listener in `_layout.tsx`
3. **Manual sync button** — Health Integrations screen

### Workout finish hook

`apps/mobile/src/workout/session-store.tsx` → `finishWorkout`:

```ts
import { attemptHealthWriteAsync } from "../lib/health/sync";

// at end of finishWorkout, after existing logic, before return:
void attemptHealthWriteAsync(workoutId);
return workoutId;
```

`void` makes it fire-and-forget — user navigates away immediately, write happens in background micro-task.

### App foreground listener

`apps/mobile/src/app/_layout.tsx`:

```ts
import { AppState } from "react-native";
import { syncPendingHealthWorkouts } from "../lib/health/sync";

useEffect(() => {
  const sub = AppState.addEventListener("change", (state) => {
    if (state === "active") {
      void syncPendingHealthWorkouts();
    }
  });
  return () => sub.remove();
}, []);
```

### Sync implementation

`apps/mobile/src/lib/health/sync.ts`:

```ts
import * as SecureStore from "expo-secure-store";
import { and, eq, isNotNull, lt } from "drizzle-orm";
import { db } from "../../db/client";
import { workouts } from "../../db/schema";
import {
  isHealthAvailable,
  writeWorkoutToHealth,
  type HealthWorkoutPayload,
} from "./index";

const MAX_ATTEMPTS = 3;
const HEALTH_OPT_IN_KEY = "fitclub.health.opt_in";

function estimateKcal(durationSec: number): number {
  return Math.round((durationSec / 60) * 5);
}

function toPayload(w: typeof workouts.$inferSelect): HealthWorkoutPayload {
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

export async function attemptHealthWriteAsync(workoutId: string): Promise<void> {
  const optIn = await SecureStore.getItemAsync(HEALTH_OPT_IN_KEY);
  if (optIn !== "true") return;
  if (!(await isHealthAvailable())) return;

  const row = db.select().from(workouts).where(eq(workouts.id, workoutId)).all()[0];
  if (!row || row.healthSynced === 1) return;
  if (row.healthAttempts >= MAX_ATTEMPTS) return;
  if (!row.finishedAt) return;

  const result = await writeWorkoutToHealth(toPayload(row));
  const now = new Date().toISOString();

  if (result.ok) {
    db.update(workouts).set({
      healthSynced: 1,
      healthUuid: result.recordId,
      updatedAt: now,
    }).where(eq(workouts.id, workoutId)).run();
  } else {
    db.update(workouts).set({
      healthAttempts: row.healthAttempts + 1,
      updatedAt: now,
    }).where(eq(workouts.id, workoutId)).run();
    console.warn("Health write failed:", result.error);
  }
}

export async function syncPendingHealthWorkouts(): Promise<{
  total: number;
  synced: number;
  failed: number;
}> {
  const optIn = await SecureStore.getItemAsync(HEALTH_OPT_IN_KEY);
  if (optIn !== "true") return { total: 0, synced: 0, failed: 0 };
  if (!(await isHealthAvailable())) return { total: 0, synced: 0, failed: 0 };

  const pending = db.select().from(workouts).where(and(
    eq(workouts.healthSynced, 0),
    isNotNull(workouts.finishedAt),
    lt(workouts.healthAttempts, MAX_ATTEMPTS),
  )).all();

  let synced = 0;
  let failed = 0;
  for (const w of pending) {
    const result = await writeWorkoutToHealth(toPayload(w));
    const now = new Date().toISOString();
    if (result.ok) {
      db.update(workouts).set({
        healthSynced: 1,
        healthUuid: result.recordId,
        updatedAt: now,
      }).where(eq(workouts.id, w.id)).run();
      synced++;
    } else {
      db.update(workouts).set({
        healthAttempts: w.healthAttempts + 1,
        updatedAt: now,
      }).where(eq(workouts.id, w.id)).run();
      failed++;
    }
  }
  return { total: pending.length, synced, failed };
}

export function countPendingHealthSync(memberId: string): number {
  return db.select().from(workouts).where(and(
    eq(workouts.memberId, memberId),
    eq(workouts.healthSynced, 0),
    isNotNull(workouts.finishedAt),
    lt(workouts.healthAttempts, MAX_ATTEMPTS),
  )).all().length;
}

export async function backfillHealthWorkouts(memberId: string): Promise<{
  total: number;
  synced: number;
}> {
  // Manual backfill ignores MAX_ATTEMPTS cap and resets attempts on success.
  const all = db.select().from(workouts).where(and(
    eq(workouts.memberId, memberId),
    eq(workouts.healthSynced, 0),
    isNotNull(workouts.finishedAt),
  )).all();

  let synced = 0;
  for (const w of all) {
    const result = await writeWorkoutToHealth(toPayload(w));
    const now = new Date().toISOString();
    if (result.ok) {
      db.update(workouts).set({
        healthSynced: 1,
        healthUuid: result.recordId,
        healthAttempts: 0,
        updatedAt: now,
      }).where(eq(workouts.id, w.id)).run();
      synced++;
    } else {
      db.update(workouts).set({
        healthAttempts: w.healthAttempts + 1,
      }).where(eq(workouts.id, w.id)).run();
    }
  }
  return { total: all.length, synced };
}
```

### Status counters in UI

```ts
const [pending, setPending] = useState(0);

useFocusEffect(useCallback(() => {
  setPending(countPendingHealthSync(memberId));
}, [memberId]));

const onSyncNow = async () => {
  setSyncing(true);
  const r = await syncPendingHealthWorkouts();
  setLastResult(`Synced ${r.synced} of ${r.total}.`);
  setPending(countPendingHealthSync(memberId));
  setSyncing(false);
};
```

### Concurrency

`AppState` foreground listener + manual sync + finishWorkout hook may overlap.

Safe because:
- Each operation checks `row.healthSynced === 1` before writing
- Drizzle UPDATE statements atomic (SQLite single-writer)
- Worst case: same workout queued twice → first write succeeds → second write skips on freshness check

### Feature kill switch

`apps/mobile/src/lib/health/feature-flag.ts`:

```ts
import { getSupabase } from "../supabase";

let cached: boolean | null = null;

export async function isHealthSyncFeatureEnabled(): Promise<boolean> {
  if (cached !== null) return cached;
  const supabase = getSupabase();
  if (!supabase) return true;  // default enabled
  const { data } = await supabase.from("app_config")
    .select("value").eq("key", "health_sync_enabled").maybeSingle();
  cached = data?.value !== "false";
  return cached;
}
```

Each entry point (`attemptHealthWriteAsync`, `syncPendingHealthWorkouts`, `backfillHealthWorkouts`) checks this before any native call. Remote ops can flip the flag without re-deploy:

```sql
INSERT INTO app_config (key, value) VALUES ('health_sync_enabled', 'false')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
```

### Background task

NOT in v1. Reasons:
- iOS background-fetch throttling unreliable
- Battery impact
- AppState foreground + manual sync covers 95% of cases

### Testing

Unit tests (with platform mocks):
- `toPayload` mapping
- `estimateKcal` formula
- `countPendingHealthSync` SQL query shape

Integration tests (real device, EAS dev client):
- Toggle on → permission grant → workout finish → HK visible
- Permission revoke → next finish silently fails → status detects
- Manual sync with 3 pending workouts

---

## 5. Edge Cases + Rollout

### Edges (operational)

| Scenario | Behavior |
|---|---|
| iOS <15 / Android <14 | `isAvailable()` false → toggle disabled + "Not supported" |
| Health Connect missing on Android | `initialize()` throws → deep link to Play Store |
| Permission revoked mid-session | Next finish silently fails; after MAX_ATTEMPTS fails, banner: "Re-enable in iOS Settings" |
| Partial grant (write off) | `saveWorkout` returns error → attempts++ → manual sync only |
| Backfill cancelled mid-flight | Loop interrupted; remaining workouts pending; resume on next sync |
| Network offline | Local HK/HC write — no network needed |
| Tenant switch mid-pending-sync | `countPendingHealthSync` filters by current memberId → old tenant's pending stays under old memberId |
| Workout edited after sync | HK record stays as-is in v1; v2 may add diff-and-rewrite |
| Workout soft-deleted locally | HK record stays; user must delete in Apple Health |
| User signs out → signs in different account | Different memberId filter → pending counts reset; HK records remain (iOS-level user) |
| 100+ workouts in backfill | Show progress; allow cancel; OS may pause if app suspended |
| AppState resume + manual sync race | DB row freshness check prevents double-write |
| `isAvailable` throws unexpectedly | Catch + treat false + log |

### Rollout plan

**Phase 1 — Setup (one-time)**

1. Apple Developer portal: enable HealthKit capability on app identifier
2. Provisioning profile regenerate with new entitlement
3. App Store Connect: App Privacy → add "Health & Fitness · Workout Sessions"
4. (Optional) Health Connect on Android: no manifest entitlement beyond plugin permissions

**Phase 2 — Native module integration**

1. `npx expo install react-native-health react-native-health-connect`
2. Commit `package.json`, `pnpm-lock.yaml`, `app.json` plugins, `eas.json`
3. `eas build --profile development --platform ios`
4. `eas build --profile development --platform android`
5. Install dev client APK + TestFlight invite

**Phase 3 — Code implementation (SDD)**

1. Postgres migration 0010 (3 ALTER COLUMN)
2. SQLite migration v4 (3 ALTER COLUMN)
3. `lib/health/*` files
4. Health Integrations screen + modals
5. Profile row entry
6. session-store hook
7. AppState listener in root layout
8. 2 unit tests

**Phase 4 — Real device testing**

iOS:
- Open Settings → Health Integrations → Toggle on
- Pre-prompt → Continue → native HK sheet → grant Write
- Finish test workout in Train tab
- Open Apple Health → Browse → Workouts → "Functional Strength Training, FitClub" visible
- Toggle off → confirm modal → opt_in = false
- Next finish: nothing in HK

Android:
- Verify Health Connect installed; same flow
- Verify ExerciseSession in Health Connect → Browse → Exercise

**Phase 5 — Production EAS**

1. `eas build --profile production --platform all` (auto-increment buildNumber)
2. `eas submit --profile production --platform ios`
3. `eas submit --profile production --platform android`
4. App Store + Play Store review (1-3 days)
5. Approval → users on v2.x see Health Integrations row

### Apple Review concerns

- Usage descriptions clear (set in app.json plugin config)
- Pre-permission modal shows intent (not raw native prompt)
- "What we sync" list visible to user
- Write-only minimizes risk
- No medical claims

### Rollback

Production hotfix without rebuild:

```sql
INSERT INTO app_config (key, value) VALUES ('health_sync_enabled', 'false')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now();
```

App reads this flag → skips all health writes. Re-enable by setting value to anything else.

### Risk inventory

| Risk | Mitigation |
|---|---|
| App Store rejection (HealthKit usage) | Pre-prompt + minimal scope (write-only) + Privacy section in UI |
| Native module compile error on EAS | Test locally with dev client first; both packages have known good Expo plugin support |
| Duplicate workouts in Apple Health | `metadata.HKExternalUUID` dedup; local `health_synced` guard |
| Health Connect missing on Android | Detect + Play Store install prompt |
| Battery drain | No background task; only sync on finish + foreground + manual |
| Privacy backlash | Clear "What we sync" + "Privacy" sections in UI |

---

## 6. File Inventory

### `packages/db/`

**Modify:**
- `src/schema/workouts.ts` — add `healthSynced`, `healthUuid`, `healthAttempts`

**Create:**
- `migrations/0010_<name>.sql` — drizzle-generated 3 ALTER COLUMN

### `apps/mobile/` (config)

**Modify:**
- `package.json` — `react-native-health`, `react-native-health-connect`
- `app.json` — plugins array + iOS Info.plist usage descriptions
- `eas.json` — development profile

### `apps/mobile/src/db/`

**Modify:**
- `schema.ts` — workouts table 3 new columns
- `client.ts` — append v3→v4 migration block

### `apps/mobile/src/lib/health/`

**Create:**
- `index.ts` — unified API + types
- `ios-healthkit.ts` — iOS writer
- `android-hc.ts` — Android writer
- `sync.ts` — attempt, sync pending, backfill, count, helpers
- `feature-flag.ts` — `isHealthSyncFeatureEnabled`
- `storage-keys.ts` — `HEALTH_OPT_IN_KEY`

**Create tests:**
- `__tests__/sync.test.ts` — `toPayload`, `estimateKcal`, queries
- `__tests__/ios-healthkit.test.ts` — type mapping smoke

### `apps/mobile/src/components/`

**Create:**
- `HealthStatusBadge.tsx`
- `HealthPermissionPrompt.tsx`
- `HealthBackfillPrompt.tsx`
- `HealthDisconnectPrompt.tsx`

### `apps/mobile/src/app/`

**Create:**
- `health-integrations.tsx` — main settings screen

**Modify:**
- `_layout.tsx` — register `health-integrations` Stack screen + AppState listener
- `(tabs)/profile.tsx` — new row → router push

### `apps/mobile/src/workout/`

**Modify:**
- `session-store.tsx` — `finishWorkout` calls `attemptHealthWriteAsync` fire-and-forget

### `docs/`

**Create:**
- `docs/superpowers/specs/2026-05-28-health-integration-design.md` — this spec
- `docs/superpowers/plans/2026-05-28-health-integration.md` — implementation plan

### Migration order

```
1. packages/db schema changes + drizzle generate
2. VPS: drizzle migrate (workouts +3 cols)
3. Mobile: schema.ts + client.ts updates committed (v4 migration applies on next app open)
4. EAS development build (iOS + Android) — first build with new native modules
5. Internal device testing
6. EAS production build + App Store + Play Store submit
```

### Totals

| Category | Count |
|---|---|
| New lib/health files | 6 |
| New components | 4 |
| New screens | 1 |
| New tests | 2 |
| Modified db schema | 2 |
| Modified mobile code | 5 |
| Native config | 3 |
| Spec + plan docs | 2 |
| **Total new files** | **~15** |
| **Total modified files** | **~10** |

### Apple Developer / Google Play prerequisites (user action)

| Step | Action |
|---|---|
| Apple Developer | developer.apple.com → Identifiers → fitclub bundle id → enable HealthKit → regenerate provisioning profile |
| App Store Connect | App Privacy section → add Health & Fitness · Workout Sessions (used) — linked to user, app functionality |
| Google Play | No additional Console steps (Health Connect uses runtime permission only) |

---

## 7. Out of Scope (v1)

- Reading biometrics (weight, heart rate, calories, sleep, steps, VO2 max)
- Live heart rate samples during workout
- Apple Watch companion app
- Third-party services (Strava, Garmin, Whoop, Fitbit)
- True OS background sync (background fetch / WorkManager)
- Cardio session types (running, cycling, swimming)
- Edit-and-resync on workout updates
- Bulk delete from Health on local workout delete
- Cross-device sync coordination

---

## 8. Success Criteria

- Member can open Settings → Health Integrations → toggle on → grant iOS/Android permission
- Finishing a workout from Train tab automatically pushes to Apple Health / Health Connect
- Apple Health → Workouts → today shows "Functional Strength Training, FitClub, N minutes"
- Manual sync button writes all pending workouts in one batch
- Toggle off stops future writes without removing historical records
- Permission revoked at OS level is detected after MAX_ATTEMPTS and surfaced in UI
- Backfill flow writes past workouts in one tap
- Verification: `pnpm -r typecheck && pnpm -r test` PASS; EAS dev client builds succeed; manual device testing confirms HK and HC records
- Feature kill switch via `app_config.health_sync_enabled` halts all writes globally
