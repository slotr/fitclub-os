import { eq } from "drizzle-orm";
import Link from "next/link";
import { studioSettings } from "@fitness/db";
import { withTenantScope } from "@/lib/db";
import { getCurrentTenantId } from "@/lib/tenant";
import { updateBrandingAction } from "./_actions";

export default async function BrandingPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string }>;
}) {
  const tenantId = await getCurrentTenantId();
  if (!tenantId) return <div>No tenant.</div>;

  const settings = await withTenantScope(tenantId, async (db) => {
    const rows = await db
      .select()
      .from(studioSettings)
      .where(eq(studioSettings.tenantId, tenantId))
      .limit(1);
    return rows[0] ?? null;
  });

  const params = await searchParams;

  return (
    <div className="max-w-xl space-y-6 p-6">
      <div className="flex items-center gap-3">
        <Link
          href={"/admin/settings" as Parameters<typeof Link>[0]["href"]}
          className="text-[13px] text-fg-muted hover:text-fg"
        >
          ← Settings
        </Link>
        <span className="text-fg-muted">/</span>
        <h1 className="text-[22px] font-extrabold tracking-tighter">
          Branding
        </h1>
      </div>

      {params.saved && (
        <div className="rounded-sm bg-green-50 p-3 text-sm text-green-800">
          Saved.
        </div>
      )}

      <form
        action={updateBrandingAction}
        encType="multipart/form-data"
        className="space-y-4"
      >
        <div>
          <label
            htmlFor="name"
            className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-fg-muted"
          >
            Gym name
          </label>
          <input
            id="name"
            name="name"
            defaultValue={settings?.name ?? ""}
            required
            maxLength={120}
            className="block h-10 w-full rounded-sm border border-[var(--border-color)] bg-bg px-3 text-[13px] text-fg outline-none focus:border-fg"
          />
        </div>

        <div>
          <label
            htmlFor="accentColor"
            className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-fg-muted"
          >
            Accent color
          </label>
          <input
            id="accentColor"
            type="color"
            name="accentColor"
            defaultValue={settings?.accentColor ?? "#2f5596"}
            className="h-10 w-20 rounded-sm border border-[var(--border-color)]"
          />
        </div>

        <div>
          <label
            htmlFor="logo"
            className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-fg-muted"
          >
            Logo (PNG / JPEG / WebP, max 1 MB)
          </label>
          {settings?.logoUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={settings.logoUrl}
              alt="Current logo"
              className="mb-2 h-16 w-16 rounded border border-[var(--border-color)] object-contain"
            />
          )}
          <input
            id="logo"
            type="file"
            name="logo"
            accept="image/png,image/jpeg,image/webp"
            className="w-full text-[13px]"
          />
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            className="inline-flex h-10 items-center rounded-sm bg-fg px-5 text-sm font-semibold text-surface hover:opacity-90"
          >
            Save branding
          </button>
          <Link
            href={"/admin/settings" as Parameters<typeof Link>[0]["href"]}
            className="inline-flex h-10 items-center rounded-sm border border-[var(--border-color)] bg-surface px-4 text-sm font-semibold hover:bg-[#faf9f7]"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
