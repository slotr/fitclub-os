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
