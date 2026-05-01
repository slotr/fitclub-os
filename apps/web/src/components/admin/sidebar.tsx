"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  HomeIcon,
  UsersIcon,
  CheckCircleIcon,
  CalendarIcon,
  ActivityIcon,
  CardIcon,
  BellIcon,
  ChartBarIcon,
  FileIcon,
  GearIcon,
} from "./icons";

type NavItem = {
  href: string;
  label: string;
  icon: (p: { className?: string }) => React.ReactElement;
  exact?: boolean;
};

const items: NavItem[] = [
  { href: "/admin", label: "Dashboard", icon: HomeIcon, exact: true },
  { href: "/admin/members", label: "Members", icon: UsersIcon },
  { href: "/admin/plans", label: "Plans", icon: CheckCircleIcon },
  { href: "/admin/classes", label: "Classes", icon: CalendarIcon },
  { href: "/admin/checkins", label: "Check-ins", icon: ActivityIcon },
  { href: "/admin/payments", label: "Payments", icon: CardIcon },
  { href: "/admin/notifications", label: "Notifications", icon: BellIcon },
  { href: "/admin/reports", label: "Reports", icon: ChartBarIcon },
  { href: "/admin/audit", label: "Audit log", icon: FileIcon },
  { href: "/admin/settings", label: "Settings", icon: GearIcon },
];

export function Sidebar() {
  const path = usePathname();
  return (
    <aside className="w-56 shrink-0 border-r border-[var(--border-color)] bg-surface px-3 py-4">
      <div className="mb-4 flex items-center gap-2 px-2">
        <span className="inline-block h-2 w-2 rounded-full bg-amber" />
        <span className="text-base font-extrabold tracking-tight">FitClub</span>
      </div>
      <nav className="flex flex-col gap-0.5 text-[13px]">
        {items.map((it) => {
          const active = it.exact
            ? path === it.href
            : path === it.href || path.startsWith(`${it.href}/`);
          const Icon = it.icon;
          return (
            <Link
              key={it.href}
              href={it.href as Parameters<typeof Link>[0]["href"]}
              className={cn(
                "relative flex items-center gap-2.5 rounded-sm px-2.5 py-2 font-medium transition-colors",
                active
                  ? "bg-[#f5f4f1] text-fg"
                  : "text-fg-muted hover:bg-[#f5f4f1] hover:text-fg",
              )}
            >
              {active && (
                <span className="absolute -left-3 top-1.5 bottom-1.5 w-[3px] rounded-r bg-amber" />
              )}
              <Icon className="h-4 w-4 shrink-0" />
              {it.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
