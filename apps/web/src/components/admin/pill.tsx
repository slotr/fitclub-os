import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

type PillVariant = "good" | "warn" | "bad" | "info" | "dark" | "outline";

const variantClass: Record<PillVariant, string> = {
  good: "pill-good",
  warn: "pill-warn",
  bad: "pill-bad",
  info: "pill-info",
  dark: "pill-dark",
  outline: "pill-outline",
};

export function Pill({
  children,
  variant = "outline",
  className,
}: {
  children: ReactNode;
  variant?: PillVariant;
  className?: string;
}) {
  return (
    <span className={cn("pill", variantClass[variant], className)}>
      {children}
    </span>
  );
}
