"use client";

import { usePathname } from "next/navigation";

const labels: Record<string, string> = {
  admin: "Dashboard",
  members: "Members",
  plans: "Plans",
  classes: "Classes",
  checkins: "Check-ins",
  payments: "Payments",
  notifications: "Notifications",
  reports: "Reports",
  audit: "Audit log",
  settings: "Settings",
  new: "New",
};

export function Breadcrumb() {
  const path = usePathname();
  const parts = path.split("/").filter(Boolean);
  if (parts[0] !== "admin") return null;
  // skip dynamic ids: render segment label or last 6 chars if uuid-like
  const crumbs = parts.map((seg, i) => {
    const label =
      labels[seg] ??
      (seg.length > 12 ? `…${seg.slice(-6)}` : seg.replace(/-/g, " "));
    return { label, last: i === parts.length - 1 };
  });
  return (
    <div className="flex items-center gap-1.5 text-[13px] text-fg-muted">
      {crumbs.map((c, i) => (
        <span key={i} className="flex items-center gap-1.5">
          {i > 0 && <span className="text-fg-faint">/</span>}
          <span className={c.last ? "font-semibold text-fg" : ""}>
            {c.label}
          </span>
        </span>
      ))}
    </div>
  );
}
