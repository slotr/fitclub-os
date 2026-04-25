import { desc } from "drizzle-orm";
import Link from "next/link";
import { plans } from "@fitness/db";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { withTenantScope } from "@/lib/db";
import { getCurrentTenantId } from "@/lib/tenant";

export default async function PlansPage() {
  const tenantId = await getCurrentTenantId();
  const rows = await withTenantScope(tenantId, async (db) =>
    db.select().from(plans).orderBy(desc(plans.createdAt)),
  );
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Plans</h1>
        <Button asChild>
          <Link href={"/admin/plans/new" as Parameters<typeof Link>[0]["href"]}>+ New plan</Link>
        </Button>
      </div>
      <div className="rounded-md border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Active</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((p) => (
              <TableRow key={p.id}>
                <TableCell>{p.name}</TableCell>
                <TableCell>
                  {(p.priceMinor / 100).toFixed(2)} {p.currency}
                </TableCell>
                <TableCell>{p.durationDays} days</TableCell>
                <TableCell>{p.active ? "Yes" : "No"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
