import { desc, eq } from "drizzle-orm";
import { checkins, members } from "@fitness/db";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { withTenantScope } from "@/lib/db";
import { getCurrentTenantId } from "@/lib/tenant";
import { manualCheckinAction } from "./_actions";

export default async function CheckinsPage() {
  const tenantId = await getCurrentTenantId();
  const rows = await withTenantScope(tenantId, async (db) =>
    db
      .select({
        id: checkins.id,
        at: checkins.checkedInAt,
        member: members.fullName,
        source: checkins.source,
      })
      .from(checkins)
      .innerJoin(members, eq(members.id, checkins.memberId))
      .orderBy(desc(checkins.checkedInAt))
      .limit(50),
  );
  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Check-ins</h1>
      <form
        action={async (fd) => {
          "use server";
          await manualCheckinAction(fd);
        }}
        className="flex max-w-md items-end gap-2"
      >
        <div className="flex-1 space-y-1">
          <label className="text-sm" htmlFor="memberId">
            Member ID
          </label>
          <Input id="memberId" name="memberId" required />
        </div>
        <Button type="submit">Mark check-in</Button>
      </form>
      <ul className="divide-y rounded-md border bg-white">
        {rows.map((r) => (
          <li key={r.id} className="flex justify-between p-3 text-sm">
            <span>{r.member}</span>
            <span className="text-neutral-500">
              {r.at.toISOString()} · {r.source}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
