# Exercise Visuals — `free-exercise-db` Import Design

**Date:** 2026-05-23
**Status:** Approved design — ready for implementation planning
**Scope:** Replace the hand-written 100-exercise seed with the open-licensed [`yuhonas/free-exercise-db`](https://github.com/yuhonas/free-exercise-db) dataset (~800 exercises) and populate `exercises.image_url` with 2-frame animated WebP loops generated from the dataset's two-frame illustrations.

---

## 1. Background

Phase 1 of the mobile workout-tracking feature shipped with a hand-written
100-exercise seed and a nullable `image_url` placeholder (no images). Members
now see a populated library but every exercise renders the muscle-icon
placeholder. We want real visuals.

We evaluated three sources:

- **ExerciseDB / `exercisedb.dev`** — ~1300 animated GIFs, but AGPL-3.0 on the
  server code and the GIF assets are a paid product. Free tier is
  explicitly "exploration only" and does not grant re-host rights, which
  conflicts with our offline-first design that must cache images locally.
- **`yuhonas/free-exercise-db`** — ~800 exercises with two static JPGs
  each (start/end positions), published under the Unlicense (public
  domain). Free for commercial use, re-host permitted.
- **Static images / Lottie / 3D** — either weaker UX or far too expensive
  to produce for 800 exercises.

`free-exercise-db` is the only option with a clean license for our offline
re-hosting model. The trade-off is that it ships static images, not animated
GIFs. We close that gap by composing the two frames into an animated WebP
loop during a one-time import, so each exercise gets a real movement
preview.

## 2. Goals & non-goals

**Goals**
- Replace the hand-written 100-exercise seed with `free-exercise-db`'s
  ~800 exercises (public domain, image-backed, consistent shape).
- Every exercise has an `image_url` pointing to an animated WebP hosted in
  Supabase Storage; the WebP loops between the dataset's start and end
  frames.
- The mobile app needs no schema change and minimal code change. React
  Native's `<Image>` renders animated WebP natively.
- The import script is idempotent and safely re-runnable.

**Non-goals**
- Hand-curating individual exercises. Heuristic mapping is good enough for
  v1; explicit overrides are deferred (§13).
- A separate static-thumbnail column for the library list (revisit only
  if perf demands it).
- True offline image bundling — relies on RN's HTTP cache for now.
- Custom-exercise image upload by members (separate feature).

## 3. Decisions log

| # | Decision |
|---|----------|
| D1 | Catalog source = `free-exercise-db` ~800 entries (Unlicense, public domain). Old 100-exercise hand-written seed is retired. |
| D2 | Each exercise's two start/end frames are composed into a single **2-frame animated WebP loop** (~1 s per frame, infinite loop) during import. |
| D3 | Generated WebPs are re-hosted in the Supabase Storage `exercise-images` bucket (public), so the app never depends on raw.githubusercontent.com at runtime. |
| D4 | The `exercises` table schema is unchanged. `image_url` carries the animated WebP URL. |
| D5 | The import is a single one-time Node script in `packages/db`, run via the same docker-on-supabase-network pattern used for migrations. |
| D6 | `metric` and `default_rest_sec` are derived heuristically from `category` / `equipment` / `mechanic` / name regex (full rules in §5). |
| D7 | Existing `exercises` rows whose slug is not in the new dataset and not referenced by any `workout_sets` row are soft-deleted (`deleted_at`). Referenced rows are preserved untouched (history is sacred). |

## 4. Architecture

```
free-exercise-db (raw.githubusercontent.com)
        │
        ├─ dist/exercises.json (~800 metadata records)
        └─ exercises/<id>/0.jpg, <id>/1.jpg
        ▼
┌─ TRANSFORM ────────────────────────────────────┐
│ • muscle/equipment enum mapping                │
│ • category+equipment+force+name → metric       │
│ • mechanic/category → default_rest_sec         │
│ • instructions[] → joined string               │
│ • slug = slugify(id)                           │
└────────────────────────────────────────────────┘
        │
        ▼
┌─ IMAGE PIPELINE (sharp, p-limit=8) ────────────┐
│ • Download 0.jpg + 1.jpg (cached locally)      │
│ • Normalise to 800×800, WebP quality 80        │
│ • Compose 2-frame animated WebP (loop, ~1 s)   │
│ • Upload Supabase Storage:                     │
│       exercise-images/<slug>.webp (upsert)     │
└────────────────────────────────────────────────┘
        │
        ▼
┌─ DB IMPORT (drizzle, single transaction) ──────┐
│ • Upsert 800 rows on (slug):                   │
│     - new slugs   → INSERT (fresh UUID)        │
│     - existing    → UPDATE (id preserved →     │
│                     workout_sets FK safe)      │
│ • Soft-delete remaining global rows whose slug │
│   is not in the new set AND that have NO       │
│   workout_sets references                      │
└────────────────────────────────────────────────┘
        │
        ▼
Mobile sync (existing pullLibrary) → next app
foreground → 800 exercises + WebP URLs land
in local SQLite. <Image> plays the WebP.
```

**Principles**
- One-shot + idempotent. Re-run is safe (slug-keyed upsert, Storage
  `upsert: true`, local frame cache).
- No schema change; no mobile sync change; the mobile UI gains a tiny
  thumbnail tweak (§7).
- Heuristics are explicit and testable as pure functions (§5, §9).
- All writes guarded by referential integrity — we never break workout
  history.

## 5. Data mapping

### 5.1 `primary_muscle` (from `primaryMuscles[0]`)

| free-exercise-db | Ours |
|---|---|
| `chest` | `chest` |
| `lats` · `middle back` · `lower back` · `traps` | `back` |
| `shoulders` | `shoulders` |
| `biceps` · `forearms` | `biceps` |
| `triceps` | `triceps` |
| `quadriceps` · `hamstrings` · `calves` · `adductors` · `abductors` | `legs` |
| `glutes` | `glutes` |
| `abdominals` · `neck` | `core` |
| (anything else / empty) | `fullBody` |

### 5.2 `equipment`

| free-exercise-db | Ours |
|---|---|
| `barbell` | `barbell` |
| `dumbbell` | `dumbbell` |
| `kettlebells` | `kettlebell` |
| `cable` | `cable` |
| `machine` | `machine` |
| `body only` | `bodyweight` |
| `bands` | `band` |
| `medicine ball` · `exercise ball` · `foam roll` · `other` · `null` | `other` |

### 5.3 `metric` (first match wins)

1. `category === 'stretching'` → **`time`**
2. `category === 'cardio'` → **`time`**
3. `equipment === 'body only'` AND `category === 'strength'`:
   - `name` matches `/plank|hold|wall sit|hollow|dead hang|l[- ]sit|bridge hold/i` → **`time`**
   - otherwise → **`reps_only`**
4. anything else → **`weight_reps`**

### 5.4 `default_rest_sec`

| Condition | Seconds |
|-----------|---------|
| `category === 'powerlifting'` | 180 |
| `mechanic === 'compound'` (strength / strongman) | 150 |
| `mechanic === 'isolation'` | 90 |
| `category` in (`cardio`, `stretching`) | 60 |
| otherwise / null | 120 |

### 5.5 Other fields

- `slug` = `slugify(id)` — lowercase, `_` → `-`, strip non-`[a-z0-9-]`. Unique
  by construction within `free-exercise-db` (their `id` is unique).
- `name` = `name` (verbatim).
- `instructions` = `instructions.join('\n\n')`.
- `image_url` = `${SUPABASE_URL}/storage/v1/object/public/exercise-images/${slug}.webp`
  on success, else `null`.
- `tenant_id` = `null`, `member_id` = `null` (global).
- `created_at`/`updated_at` = `now()` on every row touched by the import.

### 5.6 Known heuristic limits

- A few static-hold exercises in the `strength` category but with
  non-`body only` equipment may be misclassified as `weight_reps`. The
  name regex is the safety net but is not exhaustive. Accepted for v1.
- `default_rest_sec` is a coarse default. Members override per exercise
  via `member_exercise_prefs` already.

## 6. Image pipeline

For each exercise:

1. **Download** `<id>/0.jpg` and `<id>/1.jpg` from
   `https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/`.
   Persist raw bytes under `packages/db/.cache/free-exercise-db/<id>/`
   so re-runs skip the network. Some exercises have only one image;
   duplicate that single frame.
2. **Normalise** each frame with `sharp`: `resize(800, 800, { fit: 'inside' })`,
   re-encode as a single-frame WebP at quality 80.
3. **Compose** a 2-frame animated WebP — `sharp` supports multi-page
   WebP via vertical stacking + `pageHeight` and `webp({ pages: 2,
   delay: [1000, 1000], loop: 0 })`. Output ~80 KB per exercise → ~64 MB
   total across 800 exercises.
4. **Upload** to Supabase Storage:
   `supabase.storage.from('exercise-images').upload('<slug>.webp',
   buffer, { contentType: 'image/webp', upsert: true })` using the service
   role key. The bucket is created public on first run if it does not
   exist.
5. **Concurrency** `p-limit(8)` for the download+process step. Sharp uses
   libvips' internal thread pool internally; eight in-flight exercises
   keeps both network and CPU busy without overrunning either.

## 7. DB import

A single drizzle transaction:

1. `INSERT ... ON CONFLICT (slug) DO UPDATE` for all 800 rows. Existing
   slugs are updated in place — `id` is preserved, so any `workout_sets`
   FK survives.
2. Soft-delete obsolete global rows:

   ```sql
   UPDATE exercises
   SET deleted_at = now(), updated_at = now()
   WHERE tenant_id IS NULL
     AND member_id IS NULL
     AND slug NOT IN (<new 800 slugs>)
     AND id NOT IN (SELECT DISTINCT exercise_id FROM workout_sets);
   ```

   Rows referenced by any logged set are left untouched. The mobile
   `listExercises` filter (`isNull(deletedAt)`) hides soft-deleted rows
   from the library while the historical workout detail screens can still
   resolve them by id.

Both steps share one transaction; a failure rolls back atomically.

## 8. Sync impact

The mobile sync engine is unchanged. `pullLibrary` already streams
`exercises` rows with `updated_at > lastPullAt` and upserts them into the
local SQLite cache. After the import:

- All 800 rows have `updated_at = now()` and will be pulled on the next
  foreground tick (~500 KB JSON payload — fine).
- Soft-deleted rows also have a bumped `updated_at` and `deleted_at` set;
  they sync into the local cache but the library filter hides them.
- The animated WebPs are fetched on demand by RN's `<Image>` and cached
  via the platform's HTTP image cache. First open downloads visible
  exercises; subsequent views are instant.

## 9. Mobile changes

**No code change required** for the core flow — `<Image>` renders animated
WebP natively and the existing exercise detail screen already wires
`imageUrl` through.

One small optional polish in `apps/mobile/src/app/train/exercises.tsx`:
add a 40×40 thumbnail to each library list row, using the same
`image_url` (RN will play the WebP small; at that size the loop is barely
noticeable). Fallback is a tinted square with the muscle group's initial,
matching the existing detail-screen placeholder pattern.

The library list must be a virtualised `FlatList` (it likely already is);
if it is a plain `ScrollView` over 800 rows of animated WebPs, switch it
to `FlatList` as part of this change.

## 10. Error handling & edge cases

| Case | Behaviour |
|------|-----------|
| `images` array empty | Row imported with `image_url = null`; library shows placeholder |
| `images.length === 1` | Static (single-frame) WebP — image shows but does not animate |
| Download 404 / network error | Logged, `image_url = null` for that row, import continues |
| Sharp / encode error | Caught, `image_url = null`, continues |
| Storage upload error | One retry with backoff; on final failure → `image_url = null` |
| `slugify` collision within the dataset | First wins (stable sort by `id`), rest logged and skipped — extremely rare |
| Existing `workout_sets` references a global exercise not in the new set | Row preserved (the soft-delete query excludes referenced rows) |
| WebP not supported on a device | RN's `<Image>` on SDK 54 supports animated WebP; if a future RN version regresses, the static first frame still renders |
| Re-run of the script | Idempotent: cache hit on frames, Storage upsert, DB upsert by slug |
| `free-exercise-db` upstream updates | Manual `rm -rf packages/db/.cache/free-exercise-db` and re-run picks up the fresh dataset |

The script ends with a one-line summary, e.g.
`Imported 800 exercises, 781 with images, 19 image-less, 47 obsolete soft-deleted.`

## 11. Testing strategy

**Unit (`packages/db`, vitest)** — pure functions only:
- `mapMuscle`, `mapEquipment` — every dataset value → expected enum.
- `deriveMetric` — strength/body-only/Plank → time; bench → weight_reps;
  push-up → reps_only; stretching → time; cardio → time.
- `deriveDefaultRest` — every branch in §5.4.
- `slugify` — `3_4_Sit-Up` → `3-4-sit-up`; idempotent.

**Dry-run mode** — `--dry-run` flag on the script runs the transform
without touching Storage or the database, prints the first 5 mapped
exercises. Use this on the VPS before the real run.

**Manual QA after the live run**:
- `SELECT count(*) FROM exercises WHERE image_url IS NOT NULL` ≈ 780+.
- `exercise-images/` bucket contains ~800 `.webp` files.
- Mobile detail screen plays the animation.
- Library list scrolls smoothly with thumbnails.
- A workout detail referencing an obsolete (soft-deleted) exercise still
  renders its name.

## 12. Files & dependencies

**New / changed**
- Create: `packages/db/src/import-free-exercise-db.ts` — the script.
- Create: `packages/db/src/import/mappings.ts` — `mapMuscle`, `mapEquipment`,
  `deriveMetric`, `deriveDefaultRest`, `slugify` (pure functions).
- Create: `packages/db/src/import/image-pipeline.ts` — download + compose
  + upload helpers.
- Create: `packages/db/src/import/__tests__/mappings.test.ts` — vitest.
- Modify: `packages/db/package.json` — add devDeps `sharp`, `p-limit`,
  `@supabase/supabase-js`; add script `"import:free-exercise-db":
  "tsx src/import-free-exercise-db.ts"`; remove `"seed:exercises"`.
- Remove: `packages/db/src/seed-exercises.ts`,
  `packages/db/src/data/exercises.ts`,
  `packages/db/src/data/__tests__/exercises.test.ts`.

**Runtime**
- A Supabase Storage public bucket `exercise-images`. Created by the
  script on first run if missing.

## 13. Out of scope / future

- A manual override table for exercises whose `metric` or
  `default_rest_sec` is mis-derived.
- A separate small static thumbnail column if the animated-WebP
  thumbnails turn out to cost too much on low-end devices.
- Image prefetch / explicit offline asset bundle for cold-start workouts
  on cellular.
- Member-uploaded images for custom exercises.
- Localised exercise names / instructions.
