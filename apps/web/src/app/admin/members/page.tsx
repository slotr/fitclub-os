import { desc, ilike, or } from "drizzle-orm";
import { members } from "@fitness/db";
import { withTenantScope } from "@/lib/db";
import { getCurrentTenantId } from "@/lib/tenant";
import { MembersTable } from "./_components/members-table";

export default async function MembersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const sp = await searchParams;
  const q = sp.q?.trim() ?? "";
  const tenantId = await getCurrentTenantId();
  const rows = await withTenantScope(tenantId, async (db) => {
    return db
      .select()
      .from(members)
      .where(
        q
          ? or(ilike(members.fullName, `%${q}%`), ilike(members.email, `%${q}%`))
          : undefined,
      )
      .orderBy(desc(members.joinedAt))
      .limit(100);
  });
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Members</h1>
        <form>
          <input
            name="q"
            defaultValue={q}
            placeholder="Search name or email"
            className="rounded-md border px-3 py-1.5 text-sm"
          />
        </form>
      </div>
      <MembersTable rows={rows} />
    </div>
  );
}
