"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const items = [
  { id: "studio", label: "Studio" },
  { id: "branding", label: "Branding" },
  { id: "hours", label: "Hours" },
  { id: "integrations", label: "Integrations" },
  { id: "team", label: "Team" },
  { id: "security", label: "Security" },
];

export function SettingsNav() {
  const [active, setActive] = useState("studio");

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort(
            (a, b) => a.boundingClientRect.top - b.boundingClientRect.top,
          );
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: "-80px 0px -65% 0px" },
    );
    for (const it of items) {
      const el = document.getElementById(it.id);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, []);

  return (
    <aside className="text-[13px] font-medium text-fg-muted">
      <ul className="sticky top-4 space-y-1.5">
        {items.map((it) => (
          <li key={it.id}>
            <a
              href={`#${it.id}`}
              className={cn(
                "block rounded-sm px-3 py-1.5 transition-colors",
                active === it.id
                  ? "bg-[#faf9f7] font-semibold text-fg"
                  : "hover:text-fg",
              )}
            >
              {it.label}
            </a>
          </li>
        ))}
      </ul>
    </aside>
  );
}
