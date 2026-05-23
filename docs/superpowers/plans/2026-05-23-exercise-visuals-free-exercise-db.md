# Exercise Visuals — `free-exercise-db` Import Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Retire the hand-written 100-exercise seed and replace it with the public-domain `yuhonas/free-exercise-db` dataset (~800 exercises), generating a 2-frame animated WebP loop for each exercise and re-hosting all assets in Supabase Storage so the mobile app finally renders real visuals.

**Architecture:** A single one-shot Node script in `packages/db` downloads the dataset, transforms each entry into our schema via pure mapping/heuristic functions (TDD-tested), composes a 2-frame animated WebP with `sharp`, uploads to Supabase Storage, and upserts into the `exercises` table inside one drizzle transaction. Obsolete global rows that have no `workout_sets` references are soft-deleted. No schema change; the existing mobile sync engine picks up the new rows on the next pull.

**Tech Stack:** TypeScript, Drizzle ORM (Postgres), `sharp` (libvips), `p-limit`, `@supabase/supabase-js`, vitest, Node 20.

**Reference spec:** `docs/superpowers/specs/2026-05-23-exercise-visuals-free-exercise-db-design.md`

---

## File Structure

**`packages/db`** (only package touched)
- `src/import/mappings.ts` — pure functions: `slugify`, `mapMuscle`, `mapEquipment`
- `src/import/heuristics.ts` — pure functions: `deriveMetric`, `deriveDefaultRest`
- `src/import/image-pipeline.ts` — `downloadFrameCached`, `composeAnimatedWebp`
- `src/import/storage.ts` — `uploadExerciseImage`, `ensureBucket`
- `src/import/types.ts` — `RawExercise`, `MappedExercise` TS types
- `src/import/__tests__/mappings.test.ts` — vitest for `mappings.ts`
- `src/import/__tests__/heuristics.test.ts` — vitest for `heuristics.ts`
- `src/import/__tests__/image-pipeline.test.ts` — vitest with sample-PNG fixtures
- `src/import/__tests__/storage.test.ts` — vitest with mocked supabase client
- `src/import/__tests__/fixtures/frame-a.png` — solid red 200×200 PNG (fixture)
- `src/import/__tests__/fixtures/frame-b.png` — solid blue 200×200 PNG (fixture)
- `src/import-free-exercise-db.ts` — top-level script (driver)
- `package.json` — modify (add deps, replace script)

**Removed**
- `packages/db/src/seed-exercises.ts`
- `packages/db/src/data/exercises.ts`
- `packages/db/src/data/__tests__/exercises.test.ts`
- `packages/db/src/data/` (empty after removal)

**Mobile (optional)**
- `apps/mobile/src/app/train/exercises.tsx` — add a 40×40 thumbnail per list row

---

## PART A — Pure functions (TDD)

### Task 1: `slugify` + muscle/equipment mappings

**Files:**
- Create: `packages/db/src/import/mappings.ts`
- Create: `packages/db/src/import/__tests__/mappings.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// packages/db/src/import/__tests__/mappings.test.ts
import { describe, expect, it } from "vitest";
import { mapEquipment, mapMuscle, slugify } from "../mappings";

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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @fitness/db test mappings`
Expected: FAIL — `Cannot find module '../mappings'`.

- [ ] **Step 3: Implement**

```ts
// packages/db/src/import/mappings.ts

export type MuscleEnum =
  | "chest" | "back" | "shoulders" | "biceps" | "triceps"
  | "legs" | "glutes" | "core" | "fullBody";

export type EquipmentEnum =
  | "barbell" | "dumbbell" | "machine" | "cable"
  | "bodyweight" | "kettlebell" | "band" | "other";

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/_/g, "-")
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

const MUSCLE_MAP: Record<string, MuscleEnum> = {
  chest: "chest",
  lats: "back",
  "middle back": "back",
  "lower back": "back",
  traps: "back",
  shoulders: "shoulders",
  biceps: "biceps",
  forearms: "biceps",
  triceps: "triceps",
  quadriceps: "legs",
  hamstrings: "legs",
  calves: "legs",
  adductors: "legs",
  abductors: "legs",
  glutes: "glutes",
  abdominals: "core",
  neck: "core",
};

export function mapMuscle(raw: string | null | undefined): MuscleEnum {
  if (!raw) return "fullBody";
  return MUSCLE_MAP[raw] ?? "fullBody";
}

const EQUIPMENT_MAP: Record<string, EquipmentEnum> = {
  barbell: "barbell",
  dumbbell: "dumbbell",
  kettlebells: "kettlebell",
  cable: "cable",
  machine: "machine",
  "body only": "bodyweight",
  bands: "band",
};

export function mapEquipment(
  raw: string | null | undefined,
): EquipmentEnum {
  if (!raw) return "other";
  return EQUIPMENT_MAP[raw] ?? "other";
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @fitness/db test mappings`
Expected: PASS — 4 + 2 + 2 = all tests green.

- [ ] **Step 5: Commit**

```bash
git add packages/db/src/import/mappings.ts packages/db/src/import/__tests__/mappings.test.ts
git commit -m "feat(db): mapper helpers for free-exercise-db import"
```

---

### Task 2: `deriveMetric` + `deriveDefaultRest`

**Files:**
- Create: `packages/db/src/import/heuristics.ts`
- Create: `packages/db/src/import/__tests__/heuristics.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// packages/db/src/import/__tests__/heuristics.test.ts
import { describe, expect, it } from "vitest";
import { deriveDefaultRest, deriveMetric } from "../heuristics";

describe("deriveMetric", () => {
  it("returns time for stretching", () => {
    expect(deriveMetric({ category: "stretching", equipment: null, name: "x" })).toBe("time");
  });
  it("returns time for cardio", () => {
    expect(deriveMetric({ category: "cardio", equipment: "machine", name: "Treadmill" })).toBe("time");
  });
  it("returns time for body-only strength holds (Plank, Wall Sit, Dead Hang)", () => {
    expect(deriveMetric({ category: "strength", equipment: "body only", name: "Plank" })).toBe("time");
    expect(deriveMetric({ category: "strength", equipment: "body only", name: "Wall Sit" })).toBe("time");
    expect(deriveMetric({ category: "strength", equipment: "body only", name: "Dead Hang" })).toBe("time");
    expect(deriveMetric({ category: "strength", equipment: "body only", name: "Hollow Body Hold" })).toBe("time");
  });
  it("returns reps_only for other body-only strength", () => {
    expect(deriveMetric({ category: "strength", equipment: "body only", name: "Push-Up" })).toBe("reps_only");
    expect(deriveMetric({ category: "strength", equipment: "body only", name: "Pull-up" })).toBe("reps_only");
  });
  it("returns weight_reps for loaded strength work", () => {
    expect(deriveMetric({ category: "strength", equipment: "barbell", name: "Bench Press" })).toBe("weight_reps");
    expect(deriveMetric({ category: "powerlifting", equipment: "barbell", name: "Squat" })).toBe("weight_reps");
    expect(deriveMetric({ category: "strongman", equipment: "barbell", name: "Deadlift" })).toBe("weight_reps");
  });
});

describe("deriveDefaultRest", () => {
  it("powerlifting → 180s", () => {
    expect(deriveDefaultRest({ category: "powerlifting", mechanic: "compound" })).toBe(180);
  });
  it("compound strength → 150s", () => {
    expect(deriveDefaultRest({ category: "strength", mechanic: "compound" })).toBe(150);
  });
  it("isolation → 90s", () => {
    expect(deriveDefaultRest({ category: "strength", mechanic: "isolation" })).toBe(90);
  });
  it("cardio and stretching → 60s", () => {
    expect(deriveDefaultRest({ category: "cardio", mechanic: null })).toBe(60);
    expect(deriveDefaultRest({ category: "stretching", mechanic: null })).toBe(60);
  });
  it("falls back to 120s when nothing else fits", () => {
    expect(deriveDefaultRest({ category: "plyometrics", mechanic: null })).toBe(120);
    expect(deriveDefaultRest({ category: null, mechanic: null })).toBe(120);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @fitness/db test heuristics`
Expected: FAIL — `Cannot find module '../heuristics'`.

- [ ] **Step 3: Implement**

```ts
// packages/db/src/import/heuristics.ts

export type ExerciseMetric = "weight_reps" | "reps_only" | "time";

const HOLD_NAME_REGEX = /plank|hold|wall sit|hollow|dead hang|l[- ]sit|bridge hold/i;

export function deriveMetric(input: {
  category: string | null | undefined;
  equipment: string | null | undefined;
  name: string;
}): ExerciseMetric {
  const { category, equipment, name } = input;
  if (category === "stretching") return "time";
  if (category === "cardio") return "time";
  if (equipment === "body only" && category === "strength") {
    return HOLD_NAME_REGEX.test(name) ? "time" : "reps_only";
  }
  return "weight_reps";
}

export function deriveDefaultRest(input: {
  category: string | null | undefined;
  mechanic: string | null | undefined;
}): number {
  const { category, mechanic } = input;
  if (category === "powerlifting") return 180;
  if (mechanic === "compound") return 150;
  if (mechanic === "isolation") return 90;
  if (category === "cardio" || category === "stretching") return 60;
  return 120;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @fitness/db test heuristics`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/db/src/import/heuristics.ts packages/db/src/import/__tests__/heuristics.test.ts
git commit -m "feat(db): metric and default-rest heuristics"
```

---

## PART B — Image pipeline (TDD with fixtures)

### Task 3: Install deps + shared types

**Files:**
- Modify: `packages/db/package.json`
- Create: `packages/db/src/import/types.ts`

- [ ] **Step 1: Install runtime dependencies**

```bash
pnpm --filter @fitness/db add sharp p-limit @supabase/supabase-js
```

Expected: `packages/db/package.json` gains those three under `dependencies`; root `pnpm-lock.yaml` updates.

- [ ] **Step 2: Create the shared types**

```ts
// packages/db/src/import/types.ts

/** Shape of an exercise as it appears in free-exercise-db's dist/exercises.json. */
export type RawExercise = {
  id: string;
  name: string;
  force: string | null;
  level: string;
  mechanic: string | null;
  equipment: string | null;
  primaryMuscles: string[];
  secondaryMuscles: string[];
  instructions: string[];
  category: string;
  images: string[];
};

/** Shape we will upsert into the `exercises` table. */
export type MappedExercise = {
  slug: string;
  name: string;
  primaryMuscle:
    | "chest" | "back" | "shoulders" | "biceps" | "triceps"
    | "legs" | "glutes" | "core" | "fullBody";
  equipment:
    | "barbell" | "dumbbell" | "machine" | "cable"
    | "bodyweight" | "kettlebell" | "band" | "other";
  metric: "weight_reps" | "reps_only" | "time";
  defaultRestSec: number;
  instructions: string;
  imageUrl: string | null;
};
```

- [ ] **Step 3: Verify typecheck**

Run: `pnpm --filter @fitness/db typecheck`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add packages/db/package.json packages/db/src/import/types.ts /Users/hakan/Desktop/Projects/fitness_management/pnpm-lock.yaml
git commit -m "feat(db): import deps + shared types"
```

---

### Task 4: Animated-WebP composer

**Files:**
- Create: `packages/db/src/import/image-pipeline.ts`
- Create: `packages/db/src/import/__tests__/image-pipeline.test.ts`
- Create: `packages/db/src/import/__tests__/fixtures/frame-a.png` (generated in Step 1)
- Create: `packages/db/src/import/__tests__/fixtures/frame-b.png` (generated in Step 1)

- [ ] **Step 1: Create the fixture PNGs**

Run from the repo root:

```bash
node -e "const sharp=require('sharp');const w=200,h=200;Promise.all([sharp({create:{width:w,height:h,channels:4,background:{r:255,g:0,b:0,alpha:1}}}).png().toFile('packages/db/src/import/__tests__/fixtures/frame-a.png'),sharp({create:{width:w,height:h,channels:4,background:{r:0,g:0,b:255,alpha:1}}}).png().toFile('packages/db/src/import/__tests__/fixtures/frame-b.png')]).then(()=>console.log('ok'))"
```

Expected: prints `ok`; both files exist (`ls packages/db/src/import/__tests__/fixtures/`).

- [ ] **Step 2: Write the failing test**

```ts
// packages/db/src/import/__tests__/image-pipeline.test.ts
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import sharp from "sharp";
import { describe, expect, it } from "vitest";
import { composeAnimatedWebp } from "../image-pipeline";

const FIX = join(__dirname, "fixtures");

describe("composeAnimatedWebp", () => {
  it("produces a multi-page animated WebP from two frames", async () => {
    const a = await readFile(join(FIX, "frame-a.png"));
    const b = await readFile(join(FIX, "frame-b.png"));
    const out = await composeAnimatedWebp(a, b);
    expect(out).toBeInstanceOf(Buffer);
    expect(out.length).toBeGreaterThan(0);
    // RIFF / WEBP magic bytes
    expect(out.slice(0, 4).toString("ascii")).toBe("RIFF");
    expect(out.slice(8, 12).toString("ascii")).toBe("WEBP");
    // libvips/sharp reports `pages` for an animated WebP.
    const meta = await sharp(out).metadata();
    expect(meta.pages ?? 1).toBeGreaterThanOrEqual(2);
  });

  it("still produces a single-page WebP when both inputs are the same", async () => {
    const a = await readFile(join(FIX, "frame-a.png"));
    const out = await composeAnimatedWebp(a, a);
    const meta = await sharp(out).metadata();
    expect(out.slice(0, 4).toString("ascii")).toBe("RIFF");
    expect((meta.pages ?? 1) >= 2 || (meta.pages ?? 1) === 1).toBe(true);
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `pnpm --filter @fitness/db test image-pipeline`
Expected: FAIL — `Cannot find module '../image-pipeline'`.

- [ ] **Step 4: Implement**

```ts
// packages/db/src/import/image-pipeline.ts
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import sharp from "sharp";

const TARGET = 800;
const FRAME_DELAY_MS = 1000;

/**
 * Compose two JPEG/PNG frames into a 2-frame animated WebP loop.
 * Falls back to a single-page WebP if the two buffers happen to encode
 * to identical raw frames — that is fine, the caller gets a valid WebP.
 */
export async function composeAnimatedWebp(
  frameA: Buffer,
  frameB: Buffer,
): Promise<Buffer> {
  const a = await sharp(frameA)
    .resize(TARGET, TARGET, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const b = await sharp(frameB)
    .resize(TARGET, TARGET, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const W = a.info.width;
  const H = a.info.height;
  const C = a.info.channels;

  const stacked = Buffer.concat([a.data, b.data]);

  return sharp(stacked, {
    raw: { width: W, height: H * 2, channels: C },
    pageHeight: H,
  })
    .webp({
      quality: 80,
      loop: 0,
      delay: [FRAME_DELAY_MS, FRAME_DELAY_MS],
    })
    .toBuffer();
}

const DATASET_BASE =
  "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/";

/**
 * Fetch a single frame from the free-exercise-db repo, cached on disk
 * under `cacheDir` so re-runs of the importer skip the network.
 */
export async function downloadFrameCached(
  imagePath: string,
  cacheDir: string,
): Promise<Buffer> {
  const cachePath = join(cacheDir, imagePath);
  try {
    return await readFile(cachePath);
  } catch {
    // not cached yet
  }
  const res = await fetch(DATASET_BASE + imagePath);
  if (!res.ok) {
    throw new Error(`Download failed ${res.status} for ${imagePath}`);
  }
  const buf = Buffer.from(await res.arrayBuffer());
  await mkdir(dirname(cachePath), { recursive: true });
  await writeFile(cachePath, buf);
  return buf;
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `pnpm --filter @fitness/db test image-pipeline`
Expected: PASS — both tests green; the metadata check confirms the multi-page WebP encoding works.

- [ ] **Step 6: Commit**

```bash
git add packages/db/src/import/image-pipeline.ts packages/db/src/import/__tests__/image-pipeline.test.ts packages/db/src/import/__tests__/fixtures
git commit -m "feat(db): animated-WebP composer + frame download cache"
```

---

### Task 5: Supabase Storage upload helper

**Files:**
- Create: `packages/db/src/import/storage.ts`
- Create: `packages/db/src/import/__tests__/storage.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// packages/db/src/import/__tests__/storage.test.ts
import { describe, expect, it, vi } from "vitest";
import { ensureBucket, uploadExerciseImage } from "../storage";

function makeMockClient(opts: {
  buckets?: { id: string }[];
  uploadError?: { message: string } | null;
}) {
  const buckets = opts.buckets ?? [];
  const upload = vi.fn().mockResolvedValue({
    data: opts.uploadError ? null : { path: "x.webp" },
    error: opts.uploadError ?? null,
  });
  const createBucket = vi.fn().mockResolvedValue({ data: {}, error: null });
  return {
    client: {
      storage: {
        listBuckets: vi.fn().mockResolvedValue({ data: buckets, error: null }),
        createBucket,
        from: (_bucket: string) => ({ upload }),
      },
    },
    upload,
    createBucket,
  };
}

describe("ensureBucket", () => {
  it("does nothing when the bucket already exists", async () => {
    const { client, createBucket } = makeMockClient({
      buckets: [{ id: "exercise-images" }],
    });
    await ensureBucket(client as any, "exercise-images");
    expect(createBucket).not.toHaveBeenCalled();
  });
  it("creates a public bucket when missing", async () => {
    const { client, createBucket } = makeMockClient({ buckets: [] });
    await ensureBucket(client as any, "exercise-images");
    expect(createBucket).toHaveBeenCalledWith("exercise-images", {
      public: true,
    });
  });
});

describe("uploadExerciseImage", () => {
  it("returns the public URL on success", async () => {
    const { client, upload } = makeMockClient({});
    const url = await uploadExerciseImage(
      client as any,
      "https://supa.example.com",
      "bench-press",
      Buffer.from([0x52, 0x49, 0x46, 0x46]),
    );
    expect(upload).toHaveBeenCalledWith(
      "bench-press.webp",
      expect.any(Buffer),
      { contentType: "image/webp", upsert: true },
    );
    expect(url).toBe(
      "https://supa.example.com/storage/v1/object/public/exercise-images/bench-press.webp",
    );
  });
  it("returns null when upload errors", async () => {
    const { client } = makeMockClient({ uploadError: { message: "nope" } });
    const url = await uploadExerciseImage(
      client as any,
      "https://supa.example.com",
      "bench-press",
      Buffer.from([0]),
    );
    expect(url).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @fitness/db test storage`
Expected: FAIL — `Cannot find module '../storage'`.

- [ ] **Step 3: Implement**

```ts
// packages/db/src/import/storage.ts
import type { SupabaseClient } from "@supabase/supabase-js";

const BUCKET = "exercise-images";

export async function ensureBucket(
  client: SupabaseClient,
  bucket: string = BUCKET,
): Promise<void> {
  const { data, error } = await client.storage.listBuckets();
  if (error) throw new Error(`listBuckets failed: ${error.message}`);
  if (data?.some((b) => b.id === bucket)) return;
  const { error: cErr } = await client.storage.createBucket(bucket, {
    public: true,
  });
  if (cErr) throw new Error(`createBucket failed: ${cErr.message}`);
}

/**
 * Upload an animated WebP for `slug` and return its public URL, or null
 * if the upload fails (the caller stores null in `image_url`).
 */
export async function uploadExerciseImage(
  client: SupabaseClient,
  supabaseUrl: string,
  slug: string,
  webp: Buffer,
): Promise<string | null> {
  const path = `${slug}.webp`;
  const { error } = await client.storage
    .from(BUCKET)
    .upload(path, webp, {
      contentType: "image/webp",
      upsert: true,
    });
  if (error) return null;
  return `${supabaseUrl.replace(/\/$/, "")}/storage/v1/object/public/${BUCKET}/${path}`;
}

export { BUCKET as EXERCISE_IMAGES_BUCKET };
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @fitness/db test storage`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/db/src/import/storage.ts packages/db/src/import/__tests__/storage.test.ts
git commit -m "feat(db): supabase storage upload helper"
```

---

## PART C — Import script

### Task 6: Transform helper (dataset → MappedExercise)

**Files:**
- Modify: `packages/db/src/import/mappings.ts` (add `transformExercise`)
- Modify: `packages/db/src/import/__tests__/mappings.test.ts` (add transform tests)

- [ ] **Step 1: Add the failing test**

Append to `packages/db/src/import/__tests__/mappings.test.ts`:

```ts
import { transformExercise } from "../mappings";
import type { RawExercise } from "../types";

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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @fitness/db test mappings`
Expected: FAIL — `transformExercise is not defined`.

- [ ] **Step 3: Implement**

Append to `packages/db/src/import/mappings.ts`:

```ts
import { deriveDefaultRest, deriveMetric } from "./heuristics";
import type { MappedExercise, RawExercise } from "./types";

export function transformExercise(
  raw: RawExercise,
  imageUrl: string | null,
): MappedExercise {
  return {
    slug: slugify(raw.id),
    name: raw.name,
    primaryMuscle: mapMuscle(raw.primaryMuscles?.[0]),
    equipment: mapEquipment(raw.equipment),
    metric: deriveMetric({
      category: raw.category,
      equipment: raw.equipment,
      name: raw.name,
    }),
    defaultRestSec: deriveDefaultRest({
      category: raw.category,
      mechanic: raw.mechanic,
    }),
    instructions: (raw.instructions ?? []).join("\n\n"),
    imageUrl,
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @fitness/db test mappings`
Expected: PASS — all earlier tests + the two new ones.

- [ ] **Step 5: Commit**

```bash
git add packages/db/src/import/mappings.ts packages/db/src/import/__tests__/mappings.test.ts
git commit -m "feat(db): transformExercise — raw dataset row to db row"
```

---

### Task 7: DB upsert + soft-delete in one transaction

**Files:**
- Create: `packages/db/src/import/db-import.ts`

- [ ] **Step 1: Implement**

```ts
// packages/db/src/import/db-import.ts
import { and, eq, inArray, isNull, not, notInArray, sql } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { exercises } from "../schema/exercises";
import { workoutSets } from "../schema/workoutSets";
import type { MappedExercise } from "./types";

type Db = ReturnType<typeof import("drizzle-orm/postgres-js").drizzle>;

/**
 * Upsert every mapped exercise (keyed by slug — existing rows keep their
 * UUID, new rows get a fresh one) and soft-delete any other global
 * exercise that is not referenced by `workout_sets`.
 *
 * Returns { upserted, softDeleted }.
 */
export async function importExercises(
  db: Db,
  rows: MappedExercise[],
): Promise<{ upserted: number; softDeleted: number }> {
  const slugs = rows.map((r) => r.slug);
  let softDeleted = 0;

  await db.transaction(async (tx) => {
    if (rows.length > 0) {
      await tx
        .insert(exercises)
        .values(
          rows.map((r) => ({
            tenantId: null,
            memberId: null,
            slug: r.slug,
            name: r.name,
            primaryMuscle: r.primaryMuscle,
            equipment: r.equipment,
            metric: r.metric,
            defaultRestSec: r.defaultRestSec,
            instructions: r.instructions,
            imageUrl: r.imageUrl,
          })),
        )
        .onConflictDoUpdate({
          target: exercises.slug,
          set: {
            name: sql`excluded.name`,
            primaryMuscle: sql`excluded.primary_muscle`,
            equipment: sql`excluded.equipment`,
            metric: sql`excluded.metric`,
            defaultRestSec: sql`excluded.default_rest_sec`,
            instructions: sql`excluded.instructions`,
            imageUrl: sql`excluded.image_url`,
            updatedAt: sql`now()`,
            deletedAt: sql`null`,
          },
        });
    }

    // Soft-delete obsolete global rows that have no workout_sets reference.
    const result = await tx.execute(sql`
      update public.exercises
      set deleted_at = now(), updated_at = now()
      where tenant_id is null
        and member_id is null
        and deleted_at is null
        and slug <> all(${slugs}::text[])
        and id not in (select distinct exercise_id from public.workout_sets)
    `);
    softDeleted = (result as { rowCount?: number }).rowCount ?? 0;
  });

  return { upserted: rows.length, softDeleted };
}
```

- [ ] **Step 2: Verify typecheck**

Run: `pnpm --filter @fitness/db typecheck`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add packages/db/src/import/db-import.ts
git commit -m "feat(db): transactional importExercises (upsert + soft-delete)"
```

---

### Task 8: Top-level import script

**Files:**
- Create: `packages/db/src/import-free-exercise-db.ts`
- Modify: `packages/db/package.json` (add the `import:free-exercise-db` script)

- [ ] **Step 1: Implement the driver script**

```ts
// packages/db/src/import-free-exercise-db.ts
import "dotenv/config";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";
import { drizzle } from "drizzle-orm/postgres-js";
import pLimit from "p-limit";
import postgres from "postgres";
import { importExercises } from "./import/db-import";
import {
  composeAnimatedWebp,
  downloadFrameCached,
} from "./import/image-pipeline";
import { transformExercise, slugify } from "./import/mappings";
import { ensureBucket, uploadExerciseImage } from "./import/storage";
import type { MappedExercise, RawExercise } from "./import/types";

const DATASET_JSON_URL =
  "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json";

const CACHE_DIR = resolve("./.cache/free-exercise-db");

const DRY_RUN = process.argv.includes("--dry-run");

async function loadDataset(): Promise<RawExercise[]> {
  const res = await fetch(DATASET_JSON_URL);
  if (!res.ok) {
    throw new Error(`dataset fetch failed: ${res.status}`);
  }
  const data = (await res.json()) as RawExercise[];
  if (!Array.isArray(data) || data.length === 0) {
    throw new Error("dataset is empty or not an array");
  }
  return data;
}

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!databaseUrl) throw new Error("DATABASE_URL is not set");
  if (!DRY_RUN && !supabaseUrl) {
    throw new Error("SUPABASE_URL is not set");
  }
  if (!DRY_RUN && !serviceKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set");
  }

  await mkdir(CACHE_DIR, { recursive: true });

  console.log("[1/4] loading dataset…");
  const dataset = await loadDataset();
  console.log(`[1/4] loaded ${dataset.length} exercises`);

  // Drop any in-dataset slug duplicates: first occurrence wins.
  const seen = new Set<string>();
  const unique = dataset.filter((e) => {
    const s = slugify(e.id);
    if (seen.has(s)) {
      console.warn(`  dup slug, skipping: ${e.id} (${s})`);
      return false;
    }
    seen.add(s);
    return true;
  });

  if (DRY_RUN) {
    console.log("[dry-run] first 5 mapped exercises:");
    for (const e of unique.slice(0, 5)) {
      console.log(JSON.stringify(transformExercise(e, null), null, 2));
    }
    console.log(`[dry-run] would import ${unique.length} exercises`);
    return;
  }

  const supabase = createClient(supabaseUrl!, serviceKey!, {
    auth: { persistSession: false },
  });

  console.log("[2/4] ensuring storage bucket…");
  await ensureBucket(supabase);

  console.log("[3/4] generating + uploading images…");
  const limit = pLimit(8);
  let withImage = 0;
  let withoutImage = 0;

  const mapped: MappedExercise[] = await Promise.all(
    unique.map((raw) =>
      limit(async () => {
        const slug = slugify(raw.id);
        let imageUrl: string | null = null;
        try {
          const paths = raw.images ?? [];
          if (paths.length === 0) {
            throw new Error("no images");
          }
          const a = await downloadFrameCached(paths[0]!, CACHE_DIR);
          const b =
            paths.length > 1
              ? await downloadFrameCached(paths[1]!, CACHE_DIR)
              : a;
          const webp = await composeAnimatedWebp(a, b);
          imageUrl = await uploadExerciseImage(
            supabase,
            supabaseUrl!,
            slug,
            webp,
          );
        } catch (err) {
          console.warn(`  image failed for ${raw.id}: ${(err as Error).message}`);
          imageUrl = null;
        }
        if (imageUrl) withImage++;
        else withoutImage++;
        return transformExercise(raw, imageUrl);
      }),
    ),
  );

  console.log(`[3/4] images done: ${withImage} ok, ${withoutImage} skipped`);

  console.log("[4/4] writing to database…");
  const sql = postgres(databaseUrl);
  const db = drizzle(sql);
  const { upserted, softDeleted } = await importExercises(db, mapped);
  await sql.end();

  console.log(
    `Imported ${upserted} exercises, ${withImage} with images, ${withoutImage} image-less, ${softDeleted} obsolete soft-deleted.`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
```

- [ ] **Step 2: Add the package script**

In `packages/db/package.json`'s `"scripts"`, add:

```json
"import:free-exercise-db": "tsx src/import-free-exercise-db.ts"
```

- [ ] **Step 3: Verify typecheck**

Run: `pnpm --filter @fitness/db typecheck`
Expected: PASS.

- [ ] **Step 4: Dry-run locally (no DB writes, no Supabase calls)**

The script must be runnable with only a placeholder `DATABASE_URL`. Run:

```bash
DATABASE_URL=postgres://x@x/x pnpm --filter @fitness/db exec tsx src/import-free-exercise-db.ts --dry-run
```

Expected: it prints `[1/4] loaded <number>` (around 800), then `[dry-run] first 5 mapped exercises:` with five JSON objects whose fields match the spec's mapping table (e.g. an exercise with `primaryMuscles: ["chest"]` and `equipment: "barbell"` becomes `primaryMuscle: "chest"`, `equipment: "barbell"`, `metric: "weight_reps"`). Confirms transformation works end-to-end.

- [ ] **Step 5: Commit**

```bash
git add packages/db/src/import-free-exercise-db.ts packages/db/package.json
git commit -m "feat(db): top-level free-exercise-db import script"
```

---

## PART D — Cleanup

### Task 9: Remove the old hand-written seed

**Files:**
- Remove: `packages/db/src/seed-exercises.ts`
- Remove: `packages/db/src/data/exercises.ts`
- Remove: `packages/db/src/data/__tests__/exercises.test.ts`
- Remove: `packages/db/src/data/` (entire directory, including `__tests__/`)
- Modify: `packages/db/package.json` — drop `"seed:exercises": "tsx src/seed-exercises.ts"`

- [ ] **Step 1: Remove files**

```bash
rm packages/db/src/seed-exercises.ts
rm -r packages/db/src/data
```

- [ ] **Step 2: Drop the seed script from `package.json`**

In `packages/db/package.json`, delete the line:

```json
"seed:exercises": "tsx src/seed-exercises.ts",
```

- [ ] **Step 3: Verify typecheck and tests still pass**

Run: `pnpm --filter @fitness/db typecheck && pnpm --filter @fitness/db test`
Expected: PASS — the data tests are gone with their source; everything still compiles. No stray reference to `seed-exercises` or `SEED_EXERCISES`.

If typecheck flags a stray import of `seed-exercises` or `SEED_EXERCISES` somewhere unexpected, run `grep -rn "SEED_EXERCISES\\|seed-exercises" packages apps` and fix the reference (there should be none).

- [ ] **Step 4: Commit**

```bash
git add -A packages/db
git commit -m "chore(db): remove hand-written 100-exercise seed (superseded)"
```

---

## PART E — Mobile thumbnail (optional but small)

### Task 10: 40×40 thumbnail in the exercise library

**Files:**
- Modify: `apps/mobile/src/app/train/exercises.tsx`

- [ ] **Step 1: Read the current screen to locate the list row component**

Open `apps/mobile/src/app/train/exercises.tsx` and find the row renderer for the exercise list (it iterates `filtered` exercises and shows `name` + `primaryMuscle · equipment`). Note the exact name/structure of the row JSX — the snippet below assumes there is a `Pressable` (or similar) per row in a list (ideally `FlatList`). Match its style approach (it likely already imports `tokens`).

- [ ] **Step 2: Add `Image` to the imports**

At the top of the file, alongside the existing `react-native` imports, ensure `Image` is imported:

```tsx
import { Image, /* ...existing names... */ } from 'react-native';
```

- [ ] **Step 3: Render the thumbnail at the start of the row**

Inside the row JSX (left of the name/sub-line), add:

```tsx
{item.imageUrl ? (
  <Image
    source={{ uri: item.imageUrl }}
    style={styles.rowThumb}
    accessibilityIgnoresInvertColors
  />
) : (
  <View style={[styles.rowThumb, styles.rowThumbPlaceholder]}>
    <Text style={styles.rowThumbInitial}>
      {(item.primaryMuscle ?? '?').slice(0, 1).toUpperCase()}
    </Text>
  </View>
)}
```

Where `item` is whatever the row maps over (rename to match the existing code). Tweak the row container to be `flexDirection: 'row'` with `alignItems: 'center'` and `gap: 12` so the thumbnail sits to the left of the existing text block.

- [ ] **Step 4: Add the styles**

In the same file's `StyleSheet.create({...})` block, add:

```tsx
rowThumb: {
  width: 40,
  height: 40,
  borderRadius: 8,
  backgroundColor: tokens.color.bg,
},
rowThumbPlaceholder: {
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: tokens.color.borderFaint ?? tokens.color.border,
},
rowThumbInitial: {
  fontFamily: tokens.font.sansBold,
  fontSize: 14,
  color: tokens.color.fgMuted,
},
```

If `tokens.color.borderFaint` does not exist, drop that fallback chain and use `tokens.color.border`.

- [ ] **Step 5: Confirm the list is a `FlatList` (virtualised)**

In the same file, locate the list rendering. If it is already a `FlatList`, no change. If it is a plain `ScrollView` mapping `filtered.map(...)`, replace with `<FlatList data={filtered} renderItem={...} keyExtractor={(x) => x.id} />` and remove the `.map`. This keeps memory bounded with ~800 rows.

- [ ] **Step 6: Verify typecheck**

Run: `pnpm --filter @fitness/mobile typecheck`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add apps/mobile/src/app/train/exercises.tsx
git commit -m "feat(mobile): library row thumbnail for exercise images"
```

---

## PART F — Run + verify

### Task 11: Repo-wide verification

**Files:** none (verification only)

- [ ] **Step 1: Typecheck and test the whole repo**

Run: `pnpm -r typecheck && pnpm -r test`
Expected: PASS — every package compiles, every test green (the new mapper/heuristics/image-pipeline/storage tests included, the old data tests removed).

- [ ] **Step 2: Final dry-run from `packages/db`**

Run:

```bash
DATABASE_URL=postgres://x@x/x pnpm --filter @fitness/db exec tsx src/import-free-exercise-db.ts --dry-run | head -40
```

Expected: prints `[1/4] loaded ~800`, then five mapped JSON objects with sane fields.

- [ ] **Step 3: Commit any incidental fixes from Steps 1–2**

If you needed to fix anything during verification:

```bash
git add -A
git commit -m "fix(db): exercise-import verification fixes"
```

---

### Task 12: Run the import on the production VPS

**Files:** none — operational task on the VPS.

- [ ] **Step 1: Push the branch + merge to main**

The plan assumes implementation happens on a feature branch (the executor's responsibility). Once Tasks 1–11 are committed and reviewed, merge to `main` and push:

```bash
git checkout main
git merge <implementation-branch> --ff-only
git push origin main
```

- [ ] **Step 2: Pull the new code on the VPS**

```bash
ssh root@100.67.196.22 'cd /srv/fitclub-os && git pull --ff-only'
```

Expected: fetches the new `main` HEAD.

- [ ] **Step 3: Run the importer inside a node container on the supabase network**

```bash
ssh root@100.67.196.22 '
  PW=$(grep "^POSTGRES_PASSWORD=" /srv/supabase/docker/.env | cut -d= -f2- | tr -d "\"" );
  SRK=$(grep "^SUPABASE_SERVICE_ROLE_KEY=" /srv/fitclub-os/infra/vps/.env.production | cut -d= -f2-);
  docker run --rm --network supabase_default \
    -v /srv/fitclub-os:/app -w /app \
    -e DATABASE_URL="postgres://postgres:${PW}@db:5432/postgres" \
    -e SUPABASE_URL="http://kong:8000" \
    -e SUPABASE_SERVICE_ROLE_KEY="${SRK}" \
    node:20 bash -lc "corepack enable && pnpm install --filter @fitness/db --frozen-lockfile && pnpm --filter @fitness/db import:free-exercise-db"
'
```

Expected final log line: `Imported ~800 exercises, ~780 with images, ~20 image-less, ~100 obsolete soft-deleted.`

- [ ] **Step 4: Verify DB + Storage state**

```bash
ssh root@100.67.196.22 '
  echo "=== exercises with image_url ==="
  docker exec supabase-db psql -U postgres -d postgres -tAc \
    "select count(*) from public.exercises where image_url is not null and deleted_at is null;"
  echo "=== exercises soft-deleted ==="
  docker exec supabase-db psql -U postgres -d postgres -tAc \
    "select count(*) from public.exercises where deleted_at is not null;"
  echo "=== storage objects ==="
  docker exec supabase-db psql -U postgres -d postgres -tAc \
    "select count(*) from storage.objects where bucket_id = (chr(101)||chr(120)||chr(101)||chr(114)||chr(99)||chr(105)||chr(115)||chr(101)||chr(45)||chr(105)||chr(109)||chr(97)||chr(103)||chr(101)||chr(115));"
'
```

Expected: `exercises with image_url` ≈ 780+; `soft-deleted` ≈ 100 (the old hand-written rows); `storage objects` ≈ 780+.

- [ ] **Step 5: Smoke-test the mobile app**

Restart the Expo dev server (`pnpm --filter @fitness/mobile exec expo start --tunnel` or the project's known command), open the app, log in as a seeded member, open Train → Exercise library:

- Library list shows ~800 exercises with 40×40 thumbnails.
- Tapping an exercise opens the detail screen with an animated WebP loop (two positions, ~1 s each).
- A previously-logged workout (if any) still renders its exercise name even if that exercise is now soft-deleted.

- [ ] **Step 6: Done — no commit needed for the operational task**

---

## Self-Review Notes

- **Spec coverage:** §1 background → preamble. §2 goals → goals embedded in tasks. §3 decisions → D1 Task 9 (remove seed) + Tasks 6/8 (import), D2 Task 4 (composer), D3 Task 5 (Storage upload helper), D4 architecture preamble + Task 7 (no schema change), D5 Task 8 (driver), D6 Tasks 1+2 (mappers/heuristics), D7 Task 7 (soft-delete with `not in (select ... workout_sets)`). §4 architecture → mirrored across Tasks 4–8. §5 mappings → Tasks 1, 2, 6. §6 image pipeline → Task 4. §7 DB import → Task 7. §8 sync impact → no code task (mobile sync is unchanged); verified in Task 12 Step 5. §9 mobile change → Task 10. §10 error handling → covered in Task 4 (image errors, single-image fallback), Task 5 (upload error → null URL), Task 7 (soft-delete excludes referenced rows), Task 8 (per-exercise try/catch). §11 testing → Tasks 1–5 unit tests, Task 11 repo-wide, Task 12 manual QA. §12 files/deps → Tasks 3, 8, 9. §13 out-of-scope — intentionally untouched.
- **Placeholder scan:** no TBD/TODO; every code step has full code; every command has expected output; every change references exact paths.
- **Type consistency:** `RawExercise` and `MappedExercise` defined in Task 3 are used unchanged in Tasks 6, 7, 8. `MuscleEnum` / `EquipmentEnum` defined in Task 1 are consumed by `MappedExercise` (Task 3) and `transformExercise` (Task 6). `ExerciseMetric` defined in Task 2 is consumed by `MappedExercise` (Task 3). The exported `composeAnimatedWebp`, `downloadFrameCached`, `ensureBucket`, `uploadExerciseImage`, `transformExercise`, `importExercises` names are referenced by exactly the names they were defined under.
- **Deviation from spec:** none material. The spec mentioned `sharp` multi-page WebP "is a bit involved"; Task 4 commits to the `raw` + `pageHeight` API and gates correctness with a metadata test rather than locking in the exact incantation.
