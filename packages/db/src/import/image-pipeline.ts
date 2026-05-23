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
  const [a, b] = await Promise.all([
    sharp(frameA)
      .resize(TARGET, TARGET, {
        fit: "contain",
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .ensureAlpha()
      .png()
      .toBuffer(),
    sharp(frameB)
      .resize(TARGET, TARGET, {
        fit: "contain",
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .ensureAlpha()
      .png()
      .toBuffer(),
  ]);

  return sharp([a, b], { join: { animated: true } })
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
