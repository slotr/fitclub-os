# Mobile Workout Tracking — Phase 1 Design

**Date:** 2026-05-21
**Status:** Approved design — ready for implementation planning
**Scope:** Phase 1 of the "Train" feature set for the FitClub member mobile app (`apps/mobile`)

---

## 1. Background

The member mobile app today is a gym-membership companion: QR check-in, class
booking, billing, membership management. It has no workout-tracking
capability.

The goal is to add a Gymshark-Training-style workout feature. The full Gymshark
Training app has five pillars: workout logging, exercise library, workout/plan
builder, progress tracking, follow-along video. That is too large for one
spec, so the work is decomposed into three phases:

| Phase | Content | Status |
|-------|---------|--------|
| **Phase 1** | Exercise library + workout logging | **This spec** |
| Phase 2 | Progress tracking (charts, 1RM trends, PB history) | Future, separate spec |
| Phase 3 | Plan builder + follow-along video | Future, separate spec |

A separate "Social" track (admin-run competitions, community feed with
photo/video) is also planned and will be brainstormed independently after
Phase 1.

This document covers **Phase 1 only**.

## 2. Goals & non-goals

**Goals**
- Members can browse an exercise library and create their own custom exercises.
- Members can run a live workout session — start, log sets in real time, rest
  timer, finish.
- Workout data is local-first and survives app crashes / connection loss.
- Completed workouts sync to the gym's Supabase Postgres (admin-visible).
- Members can export a personal backup of their workout data to their own
  cloud (iCloud Drive / Google Drive) via the OS share sheet.

**Non-goals (Phase 1)**
- Progress charts / 1RM trend visualisations (Phase 2).
- Named reusable routines / weekly plan builder (Phase 3).
- Follow-along video content (Phase 3).
- Automatic background cloud backup (future — needs iCloud entitlement /
  Google OAuth / native modules).
- Social features (separate track).
- Member-level RLS isolation rework (see §14).

## 3. Decisions log

These were settled during brainstorming:

| # | Decision |
|---|----------|
| D1 | Exercise library = global seed (~80–120 exercises) **plus** member-created custom exercises. |
| D2 | Exercise presentation = text + a static image. Member-custom exercises are text only. |
| D3 | Logging flow = **live session**: "Start workout" → log sets in real time → rest timer → "Finish". |
| D4 | Architecture = **SQLite local-first** (expo-sqlite). Local DB is the source of truth; background sync to Supabase. |
| D5 | Workout reuse in v1 = "Repeat last/this workout" (re-run a previous workout). No named routines. |
| D6 | Navigation = a new 5th bottom-tab "Train". |
| D7 | In-app UI copy is **English** (the app's default locale is `en`). |
| D8 | Cloud layer = Supabase sync (gym/admin visibility) **plus** manual personal backup export via the OS share sheet. |
| D9 | Rest timer = circular countdown gauge; −5 / +5 buttons (5-second steps); per-set custom rest. |
| D10 | Per-exercise default rest is persisted (`exercises.default_rest_sec` baseline + `member_exercise_prefs` override). |

## 4. Architecture

```
┌─ UI ─────────────────────────────────────────────┐
│  Train tab (5th tab) — Expo Router screens        │
└───────────────────────┬──────────────────────────┘
                        │ instant, synchronous, no spinner
┌─ Active session ──────▼──────────────────────────┐
│  WorkoutSessionProvider (React Context)           │
│  every set change → written through to SQLite     │
└───────────────────────┬──────────────────────────┘
┌─ Local store ─────────▼──────────────────────────┐
│  expo-sqlite + drizzle-orm/expo-sqlite            │
│  source of truth for the member's workout data    │
└───────────────────────┬──────────────────────────┘
                        │ async, background
┌─ Sync engine ─────────▼──────────────────────────┐
│  on foreground / network-available / after Finish:│
│  • PULL: global exercise library → local cache    │
│  • PUSH: pending workouts → Supabase  (LWW)       │
└──────────┬─────────────────────────┬─────────────┘
           │                         │
┌─ Supabase Postgres ──┐   ┌─ Backup / restore ────┐
│ gym DB, admin-visible│   │ Export → JSON file →  │
│ workouts (read mirror)│  │ share sheet →         │
│                      │   │ iCloud / Google Drive │
└──────────────────────┘   └───────────────────────┘
```

**Principles**
- The local SQLite DB is the **source of truth** for a member's workout data.
  All UI reads from SQLite → everything is instant and works fully offline.
- The active session is **written through to SQLite** on every change (not held
  only in memory / AsyncStorage) → a crash or background-kill mid-set loses
  nothing.
- Supabase is a **read mirror** for the gym: the admin web app reads workout
  data, never writes it. Sync is predominantly one-way (member → server); the
  library pull is the read half.
- Conflicts are rare (member-owned, append-heavy, mostly single-device);
  resolved last-write-wins by `updated_at`. Device-generated UUIDs make all
  writes idempotent upserts.

**New mobile dependencies:** `expo-sqlite`, the `drizzle-orm/expo-sqlite`
driver, `expo-sharing`, `expo-document-picker`, `@react-native-community/netinfo`.
All Expo-compatible, no custom native modules.

## 5. Data model

### 5.1 Supabase Postgres (new tables, `packages/db`)

Follows existing conventions: `id()` UUID PKs, `tenantId`/`memberId` FKs,
`createdAt()`/`updatedAt()`/`deletedAt()` helpers, `pgEnum` enums.

**`exercises`** — unified catalog. A row with both `tenant_id` and `member_id`
NULL is a global seed exercise; a row with both set is a member-custom
exercise.

| Column | Notes |
|--------|-------|
| `id` | UUID PK |
| `tenant_id`, `member_id` | both NULL = global seed; both set = member-custom |
| `slug` | unique for global rows (`barbell-bench-press`); NULL for custom |
| `name` | text |
| `primary_muscle` | enum: chest, back, shoulders, biceps, triceps, legs, glutes, core, fullBody |
| `equipment` | enum: barbell, dumbbell, machine, cable, bodyweight, kettlebell, band, other |
| `metric` | enum: `weight_reps`, `reps_only`, `time` — drives the logging UI |
| `default_rest_sec` | int, baseline rest (seed value for global; set at creation for custom) |
| `instructions` | text, step-by-step (global only) |
| `image_url` | text, **nullable** — fallback to a muscle-group icon placeholder |
| `created_at` / `updated_at` / `deleted_at` | standard; custom exercises are soft-deleted |

**`member_exercise_prefs`** — per-member overrides for any exercise.

| Column | Notes |
|--------|-------|
| `id` | UUID PK |
| `tenant_id`, `member_id` | FKs |
| `exercise_id` | FK → `exercises` |
| `default_rest_sec` | int — member's preferred default rest for this exercise |
| `created_at` / `updated_at` | standard |

Effective default rest = `pref.default_rest_sec ?? exercise.default_rest_sec ?? 90`.

**`workouts`** — a completed workout session.

| Column | Notes |
|--------|-------|
| `id` | UUID PK (device-generated) |
| `tenant_id`, `member_id` | FKs |
| `title` | text, default `"Workout"` |
| `started_at` / `finished_at` | timestamptz |
| `duration_sec` | int |
| `total_volume` | numeric — Σ(weight × reps), denormalised for fast history display |
| `notes` | text |
| `created_at` / `updated_at` / `deleted_at` | standard |

**`workout_sets`** — every logged set. The "exercises within a workout" are
modelled by `order_index` rather than a separate `workout_exercises` table.

| Column | Notes |
|--------|-------|
| `id` | UUID PK (device-generated) |
| `workout_id` | FK → `workouts` (cascade) |
| `exercise_id` | FK → `exercises` |
| `order_index` | int — exercise order within the workout |
| `set_index` | int — set number within the exercise |
| `weight` | numeric, nullable (NULL for `reps_only` / `time`) |
| `reps` | int, nullable (NULL for `time`) |
| `duration_sec` | int, nullable (used by `time`-metric exercises) |
| `rest_sec` | int, nullable — planned rest after this set; NULL = use effective default |
| `is_warmup` | bool |
| `is_pr` | bool — computed at Finish |
| `created_at` | standard |

Indexes: `workout_sets` on `(workout_id)` and `(exercise_id)`; `workouts` on
`(member_id, started_at)`.

### 5.2 Local SQLite (expo-sqlite via drizzle)

Mirrors the Supabase tables, plus sync metadata:

- **`exercises`** — cached copy of global exercises + the member's own custom
  exercises. Adds `synced_at`.
- **`member_exercise_prefs`** — mirror; adds `sync_status`.
- **`workouts`** — mirror; adds `sync_status` (`pending` | `synced` | `failed`)
  and `is_active` (marks the single in-progress session).
- **`workout_sets`** — mirror.

No separate sync-queue table — the sync engine selects rows by
`sync_status = 'pending'`.

### 5.3 RLS — new `infra/supabase/policies/0004_workout_policies.sql`

- `exercises`: `select` using `member_id IS NULL OR tenant_id = current_tenant_id()`;
  `insert`/`update` with check `tenant_id = current_tenant_id()`.
- `member_exercise_prefs`, `workouts`, `workout_sets`: tenant-scoped
  (`tenant_id = current_tenant_id()`), following the `checkins` policy pattern.

> **Note:** Full member-level isolation needs a `current_member_id()` helper.
> The existing app already does not enforce member-level isolation. Phase 1
> matches the existing pattern; hardening to member-level RLS is tracked as
> future work (§14).

## 6. Screens & navigation

New bottom tab **"Train"** (5 tabs total: Home · Classes · Train · Pay ·
Profile). Expo Router structure:

```
(tabs)/train.tsx          → Screen 1: Train home
train/active.tsx          → Screen 2: Active workout (tab bar hidden, full-screen)
train/exercises.tsx       → Screen 3: Exercise library (browse + picker modes)
train/exercise/[id].tsx   → Screen 5: Exercise detail
train/exercise/new.tsx    → Screen 6: Create custom exercise
train/workout/[id].tsx    → Screen 4: Workout detail (history item)
```

1. **Train home** — "Start workout" CTA; "Repeat last workout" card (if history
   exists); recent workout history list; link to the exercise library.
2. **Active workout** — elapsed timer; per-exercise cards with set rows
   (weight × reps inputs + done checkbox); "Add exercise"; rest-timer overlay;
   "Finish workout". Tab bar hidden.
3. **Exercise library / picker** — search bar; filter chips (muscle,
   equipment); exercise list; "Create custom exercise". Browse mode → tap opens
   detail; picker mode → tap adds to the active workout.
4. **Workout detail** — a completed workout: PR celebration banner; per-exercise
   set breakdown; "Repeat this workout".
5. **Exercise detail** — name, image, muscle, equipment, step-by-step
   instructions, effective default rest.
6. **Create custom exercise** — form: name, primary muscle, equipment, metric,
   default rest, notes.
7. **Backup** — lives in the Profile area: "Export backup" / "Import backup".

## 7. Live session state flow

`WorkoutSessionProvider` (React Context). Every transition writes through to
SQLite.

```
idle ──"Start workout" / "Repeat last/this workout"──▶ active
   create SQLite workouts row: is_active=1, started_at=now, finished_at=null
   (Repeat variant pre-populates target exercises + sets, done=false)

active  (loop — each action writes to SQLite immediately):
   • Add exercise → picker → insert workout_sets rows (planned, done=false)
   • Log set → enter weight/reps → mark done → start rest timer
   • Edit / delete sets, reorder exercises
   • Elapsed timer runs from started_at

active ──app backgrounded / killed → relaunch──▶ active (auto-resume)
   Provider queries SQLite for is_active=1 on startup → resumes directly.
   Mid-set kill = zero data loss.

active ──"Finish workout"──▶ finishing
   compute duration_sec, total_volume; PR detection per exercise
   (compare against prior bests in local history — max weight / Epley 1RM);
   set finished_at=now, is_active=0, sync_status='pending' (single transaction)
   ──▶ Workout detail screen with PR celebration ──▶ idle

active ──"Discard"──▶ idle  (delete the active row)
```

**Constraints**
- Exactly one active session at a time (`is_active = 1` is unique). Tapping
  "Start" while one exists routes to resume.
- Sync never touches this flow — the session only talks to SQLite.
- PR computation is fully local (history is in SQLite) → runs at Finish, no
  network required. The first-ever set of an exercise is not flagged a PR (no
  baseline).

## 8. Rest timer

- **Circular gauge** countdown: an amber arc depletes; centre shows `mm:ss` and
  `of [target]`.
- Starts automatically when a set is marked done, with that set's effective
  rest (`set.rest_sec ?? effective default`).
- **−5 / +5 buttons:** each tap adjusts by 5 seconds, including the remaining
  time while running. Press-and-hold = fast repeat. Pause / Skip controls.
- On completion: haptic + sound; the gauge auto-dismisses. "Skip" closes early.
- **Per-set custom rest:** tapping a set row's rest badge sets an override for
  the rest after that set (`workout_sets.rest_sec`).
- **Per-exercise default rest:** adjustable with −5 / +5; persisted via
  `member_exercise_prefs.default_rest_sec`. New sets inherit it.
- If the app is backgrounded while resting, the timer's end timestamp is stored
  so the remaining time is recomputed on resume.

## 9. Sync engine

**Triggers:** app foreground (cold start + resume); network becomes available
(`netinfo` listener); immediately after "Finish"; manual "Sync now" in Profile.

**PULL (library):** fetch global `exercises` where `updated_at > last_pull_at`
→ upsert into the local cache. Also pull the member's own custom exercises and
`member_exercise_prefs` (covers multi-device). Store `last_pull_at` for
incremental pulls.

**PUSH (workouts):** select local `workouts` where `sync_status = 'pending'`;
for each, upsert the workout + its `workout_sets` + any referenced custom
exercises + prefs into Supabase. Success → `sync_status = 'synced'`; failure →
`sync_status = 'failed'`, retried next cycle. All pending rows pushed in one
pass.

**Conflict resolution:** device-generated UUIDs → no ID collisions; per-row
last-write-wins by `updated_at`; soft deletes propagate via `deleted_at`;
upserts are idempotent so retries are safe.

**Status indicator:** a small badge in Train / Profile — "All synced" /
"N workouts pending".

## 10. Backup & restore

Manual, via the OS share sheet (no OAuth, no native modules).

**Export** (in Profile): serialise the member's local data to JSON —
`{ version: 1, exportedAt, memberId, exercises: [custom], memberPrefs: [...],
workouts: [...], sets: [...] }` — write a temp file via `expo-file-system`
(`fitclub-workouts-YYYY-MM-DD.json`), then `expo-sharing` opens the share sheet
so the member can save to iCloud Drive / Google Drive / AirDrop.

**Import**: `expo-document-picker` selects a JSON file; validate `version`
(mismatch → reject with a clear message, no partial merge); merge into SQLite
inside a single transaction — per row, ID match → newer `updated_at` wins, no
match → insert. Merged workouts are marked `sync_status = 'pending'` so the
next sync pushes them. Show a summary ("Imported 12 workouts, 3 custom
exercises"). Import never wipes existing local data.

**Two layers together:** a new device → log in → Supabase pull restores synced
history. The backup file is a member-owned copy **independent of the gym** —
survives even if gym data is lost or the member leaves.

## 11. Error handling & edge cases

- **Sync failure** → `sync_status = 'failed'`, retried next cycle; never blocks
  the UI (local-first).
- **No network at Finish** → workout saved locally as `pending`, synced later;
  no error surfaced to the member.
- **Corrupt / invalid backup JSON** → rejected with a clear message; no partial
  merge. `version` mismatch → rejected.
- **Large backup file** → batched insert inside one transaction.
- **Exercise referenced by past workouts is removed** → exercises are never
  hard-deleted; soft delete (`deleted_at`). Workout history always renders.
- **Custom exercise deleted but referenced by old workouts** → soft delete;
  history still shows it.
- **Two devices** → each workout has a distinct UUID → both coexist server-side
  (they are different workouts). The active session is never pushed, so each
  device keeps its own local `is_active` row.
- **Killed mid-"finishing"** → the workout is still `is_active = 1` (Finish not
  committed) → resumes as active; the member taps Finish again. Finish is a
  single transaction.
- **First time doing an exercise** → no baseline → not flagged as a PR.
- **Rest timer + backgrounding** → end timestamp stored; remaining time
  recomputed on resume.
- **Time-metric exercises** (e.g. plank) → `weight`/`reps` NULL, `duration_sec`
  used; the UI adapts per `metric`.
- **Empty states** → no history / empty library (before first pull) / no custom
  exercises.
- **SQLite schema migration** → drizzle expo-sqlite migrations run on app
  startup.
- **Missing exercise image** → muscle-group icon placeholder.

## 12. Seed data

~80–120 common exercises seeded in `packages/db` (extending the existing seed),
each with `name`, `slug`, `primary_muscle`, `equipment`, `metric`,
`default_rest_sec`, `instructions`. Images live in a public Supabase Storage
bucket `exercise-images`; `image_url` is nullable and falls back to a
placeholder if an image is not yet available.

## 13. Testing strategy

- **Unit (vitest, repo `pnpm test`):** PR computation (Epley 1RM + comparison),
  `total_volume`, backup serialise/deserialise round-trip, merge LWW logic,
  sync-queue selection. Logic is extracted into pure functions to keep this
  coverage meaningful.
- **DB:** workout schema tests added to `packages/db/__tests__`. RLS policies
  applied in CI (existing policy loop).
- **Sync:** integration test with a mocked Supabase client — push/pull
  idempotency.
- **Mobile UI:** the app has no RN component tests today → screens covered by
  manual QA; critical logic covered by the unit tests above.
- **E2E:** out of scope for v1 (no detox setup).

## 14. Out of scope / future work

- Phase 2: progress tracking (charts, 1RM trends, PB history).
- Phase 3: plan builder + follow-along video.
- Social track: admin-run competitions, community feed (photo/video/shorts) —
  brainstormed separately, starting with competitions.
- Automatic background cloud backup to iCloud Drive / Google Drive.
- Member-level RLS isolation (`current_member_id()` helper).
- RN component / E2E test infrastructure.
