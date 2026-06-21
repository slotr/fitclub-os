"use client";

import { cn } from "@/lib/utils";
import { useState } from "react";

export function Seg({
  options,
  value,
  onChange,
  size = "md",
}: {
  options: readonly string[];
  value?: string;
  onChange?: (v: string) => void;
  size?: "sm" | "md";
}) {
  const [internal, setInternal] = useState(value ?? options[0]);
  const active = value ?? internal;
  const set = (v: string) => {
    if (onChange) onChange(v);
    else setInternal(v);
  };
  return (
    <div
      className={cn(
        "inline-flex rounded-sm border border-[var(--border-color)] bg-surface p-[3px] text-xs font-medium",
        size === "sm" && "text-[11px]",
      )}
    >
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => set(opt)}
          className={cn(
            "rounded-[6px] px-3 py-1 transition-colors",
            active === opt
              ? "bg-fg text-surface"
              : "text-fg-muted hover:text-fg",
          )}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}
