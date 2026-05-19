import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

type DeltaTone = "up" | "down" | "flat";

const toneClass: Record<DeltaTone, string> = {
  up: "text-good",
  down: "text-bad",
  flat: "text-fg-muted",
};

export function KpiCard({
  label,
  value,
  delta,
  deltaTone = "flat",
  spark,
  className,
}: {
  label: string;
  value: ReactNode;
  delta?: ReactNode;
  deltaTone?: DeltaTone;
  spark?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-md bg-surface px-4 py-3.5 shadow-fc-1",
        className,
      )}
    >
      <div className="text-[10px] font-semibold uppercase tracking-widest2 text-fg-muted">
        {label}
      </div>
      <div className="mt-1 text-[28px] font-extrabold leading-tight tracking-tighter tnum">
        {value}
      </div>
      {delta && (
        <div
          className={cn(
            "mt-0.5 text-[11px] font-semibold",
            toneClass[deltaTone],
          )}
        >
          {delta}
        </div>
      )}
      {spark && <div className="mt-2">{spark}</div>}
    </div>
  );
}
