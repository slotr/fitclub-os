import { desc } from "drizzle-orm";
import { auditLogs } from "@fitness/db";
import { withTenantScope } from "@/lib/db";
import { getCurrentTenantId } from "@/lib/tenant";

export default async function AuditPage() {
  const tenantId = await getCurrentTenantId();
  const rows = await withTenantScope(tenantId, async (db) =>
    db.select().from(auditLogs).orderBy(desc(auditLogs.createdAt)).limit(200),
  );
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Audit log</h1>
      <ul className="divide-y rounded-md border bg-white text-sm">
        {rows.map((r) => (
          <li key={r.id} className="grid grid-cols-12 gap-2 p-3">
            <span className="col-span-3 text-neutral-500">
              {r.createdAt.toISOString()}
            </span>
            <span className="col-span-2 font-medium">{r.action}</span>
            <span className="col-span-2">{r.targetType}</span>
            <span className="col-span-5 truncate text-neutral-600">
              {r.targetId ?? "—"}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
