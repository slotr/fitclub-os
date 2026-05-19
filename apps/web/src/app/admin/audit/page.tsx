import { desc } from "drizzle-orm";
import { auditLogs } from "@fitness/db";
import { withTenantScope } from "@/lib/db";
import { getCurrentTenantId } from "@/lib/tenant";
import { DataTable, Td, Th, TrRow } from "@/components/admin/data-table";
import { Pill } from "@/components/admin/pill";

function actionTone(
  action: string,
): "good" | "warn" | "bad" | "info" | "outline" {
  if (action.endsWith(".succeeded") || action.endsWith(".success") || action.endsWith(".paid")) return "good";
  if (action.endsWith(".failed") || action.endsWith(".cancelled")) return "bad";
  if (action.endsWith(".warn") || action.endsWith(".retry")) return "warn";
  if (action.endsWith(".create") || action.endsWith(".update")) return "info";
  return "outline";
}

function fmt(d: Date) {
  return new Date(d).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function maskId(id: string | null) {
  if (!id) return "—";
  return `${id.slice(0, 2)}****${id.slice(-2)}`;
}

export default async function AuditPage() {
  const tenantId = await getCurrentTenantId();
  const rows = await withTenantScope(tenantId, async (db) =>
    db.select().from(auditLogs).orderBy(desc(auditLogs.createdAt)).limit(200),
  );

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-[22px] font-extrabold tracking-tighter">
            Audit log
          </h1>
          <p className="mt-1 text-[12px] text-fg-muted tnum">
            {rows.length.toLocaleString("en-US")} events · last 200
          </p>
        </div>
        <button className="h-9 rounded-sm border border-[var(--border-color)] bg-surface px-3.5 text-[13px] font-semibold hover:bg-[#faf9f7]">
          Export JSON
        </button>
      </div>

      <DataTable>
        <thead>
          <tr>
            <Th className="w-32">Time</Th>
            <Th className="w-32">Actor</Th>
            <Th className="w-44">Action</Th>
            <Th className="w-24">Target</Th>
            <Th className="w-20">ID</Th>
            <Th className="w-32">IP</Th>
            <Th>Payload</Th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <TrRow>
              <Td colSpan={7} className="py-12 text-center text-fg-muted">
                No audit events yet.
              </Td>
            </TrRow>
          )}
          {rows.map((r) => (
            <TrRow key={r.id}>
              <Td className="tnum text-fg-muted">{fmt(r.createdAt)}</Td>
              <Td>{r.actorId ? maskId(r.actorId) : "System"}</Td>
              <Td>
                <Pill variant={actionTone(r.action)}>{r.action}</Pill>
              </Td>
              <Td className="text-fg-muted">{r.targetType}</Td>
              <Td className="font-mono text-[12px] text-fg-muted">
                {maskId(r.targetId)}
              </Td>
              <Td className="font-mono text-[12px] text-fg-muted">
                {r.ip ?? "—"}
              </Td>
              <Td className="font-mono text-[11px] text-fg-muted">
                {r.payload ? JSON.stringify(r.payload).slice(0, 80) : "—"}
              </Td>
            </TrRow>
          ))}
        </tbody>
      </DataTable>
    </div>
  );
}
