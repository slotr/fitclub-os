import Link from "next/link";

const items = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/members", label: "Members" },
  { href: "/admin/plans", label: "Plans" },
  { href: "/admin/checkins", label: "Check-ins" },
  { href: "/admin/audit", label: "Audit log" },
];

export function Sidebar() {
  return (
    <aside className="w-56 border-r bg-white p-4">
      <div className="mb-6 text-lg font-bold">FitClub</div>
      <nav className="flex flex-col gap-1 text-sm">
        {items.map((i) => (
          <Link
            key={i.href}
            href={i.href as Parameters<typeof Link>[0]["href"]}
            className="rounded-md px-3 py-2 text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
          >
            {i.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
