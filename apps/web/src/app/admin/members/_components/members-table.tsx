import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Member } from "@fitness/db";

export function MembersTable({ rows }: { rows: Member[] }) {
  if (rows.length === 0) {
    return (
      <p className="rounded-md border bg-white p-8 text-center text-sm text-neutral-500">
        No members yet.
      </p>
    );
  }
  return (
    <div className="rounded-md border bg-white">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Joined</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((m) => (
            <TableRow key={m.id}>
              <TableCell>
                <Link
                  className="hover:underline"
                  href={`/admin/members/${m.id}` as Parameters<typeof Link>[0]["href"]}
                >
                  {m.fullName}
                </Link>
              </TableCell>
              <TableCell>{m.email}</TableCell>
              <TableCell className="capitalize">{m.status}</TableCell>
              <TableCell>{m.joinedAt.toISOString().slice(0, 10)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
