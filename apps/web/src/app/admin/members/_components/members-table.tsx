import Link from "next/link";
import { Avatar } from "@/components/admin/avatar";
import { Pill } from "@/components/admin/pill";
import { DataTable, Td, Th, TrRow } from "@/components/admin/data-table";
import { MoreVerticalIcon } from "@/components/admin/icons";

type Row = {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  status: "active" | "inactive" | "pending";
  joinedAt: Date;
  planName: string | null;
  membershipStatus: "active" | "paused" | "past_due" | "cancelled" | null;
};

function maskPhone(p: string | null) {
  if (!p) return "—";
  if (p.length < 8) return p;
  return `${p.slice(0, 6)} ••• ${p.slice(-4)}`;
}

function relTime(date: Date) {
  const now = Date.now();
  const t = new Date(date).getTime();
  const diff = now - t;
  const day = 86400000;
  if (diff < day) {
    const time = new Date(date).toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
    });
    return `Today, ${time}`;
  }
  if (diff < 2 * day) return "Yesterday";
  if (diff < 7 * day) return `${Math.floor(diff / day)} days ago`;
  if (diff < 30 * day)
    return `${Math.floor(diff / (7 * day))} weeks ago`;
  if (diff < 365 * day)
    return `${Math.floor(diff / (30 * day))} months ago`;
  return new Date(date).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function pillFor(row: Row): {
  variant: "good" | "warn" | "bad" | "info" | "outline";
  label: string;
} {
  const ms = row.membershipStatus;
  if (ms === "past_due") return { variant: "warn", label: "Past due" };
  if (ms === "paused") return { variant: "info", label: "Paused" };
  if (ms === "cancelled") return { variant: "bad", label: "Cancelled" };
  if (row.status === "active") return { variant: "good", label: "Active" };
  if (row.status === "pending") return { variant: "outline", label: "Pending" };
  return { variant: "bad", label: "Inactive" };
}

export function MembersTable({ rows }: { rows: Row[] }) {
  if (rows.length === 0) {
    return (
      <div className="rounded-md bg-surface p-12 text-center text-sm text-fg-muted shadow-fc-1">
        No members match the search.
      </div>
    );
  }
  return (
    <DataTable>
      <thead>
        <tr>
          <Th className="w-10"></Th>
          <Th>Member</Th>
          <Th>Plan</Th>
          <Th>Status</Th>
          <Th>Joined</Th>
          <Th>Last visit</Th>
          <Th className="w-12 text-right">&nbsp;</Th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => {
          const pill = pillFor(row);
          return (
            <TrRow key={row.id}>
              <Td>
                <input type="checkbox" disabled className="accent-amber" />
              </Td>
              <Td>
                <Link
                  href={
                    `/admin/members/${row.id}` as Parameters<
                      typeof Link
                    >[0]["href"]
                  }
                  className="flex items-center gap-3 hover:underline"
                >
                  <Avatar name={row.fullName} size={28} />
                  <div className="min-w-0">
                    <div className="font-semibold leading-tight">
                      {row.fullName}
                    </div>
                    <div className="truncate text-[11px] text-fg-muted">
                      {row.email} · {maskPhone(row.phone)}
                    </div>
                  </div>
                </Link>
              </Td>
              <Td>{row.planName ?? "—"}</Td>
              <Td>
                <Pill variant={pill.variant}>{pill.label}</Pill>
              </Td>
              <Td className="tnum">
                {new Date(row.joinedAt).toLocaleDateString("en-GB", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })}
              </Td>
              <Td className="tnum">{relTime(row.joinedAt)}</Td>
              <Td className="text-right">
                <button className="text-fg-faint hover:text-fg">
                  <MoreVerticalIcon className="inline h-4 w-4" />
                </button>
              </Td>
            </TrRow>
          );
        })}
      </tbody>
    </DataTable>
  );
}
