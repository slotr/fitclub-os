import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export function PageHeader({
  title,
  eyebrow,
  right,
  className,
}: {
  title: ReactNode;
  eyebrow?: ReactNode;
  right?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center justify-between", className)}>
      <div>
        {eyebrow && (
          <div className="text-[11px] font-semibold uppercase tracking-widest2 text-fg-muted">
            {eyebrow}
          </div>
        )}
        <h1 className="text-[22px] font-extrabold leading-tight tracking-tighter">
          {title}
        </h1>
      </div>
      {right && <div className="flex items-center gap-2">{right}</div>}
    </div>
  );
}
