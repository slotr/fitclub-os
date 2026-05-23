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
