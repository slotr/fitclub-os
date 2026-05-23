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
