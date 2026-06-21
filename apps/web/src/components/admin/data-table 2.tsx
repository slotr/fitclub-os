import { cn } from "@/lib/utils";
import type { ReactNode, ThHTMLAttributes, TdHTMLAttributes } from "react";

export function DataTable({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-md bg-surface shadow-fc-1",
        className,
      )}
    >
      <table className="w-full border-separate border-spacing-0">
        {children}
      </table>
    </div>
  );
}

export function Th({
  className,
  children,
  ...rest
}: ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      className={cn(
        "border-b border-[var(--border-color)] bg-[#faf9f7] px-3.5 py-2 text-left text-[11px] font-semibold uppercase tracking-wider2 text-fg-muted",
        className,
      )}
      {...rest}
    >
      {children}
    </th>
  );
}

export function Td({
  className,
  children,
  ...rest
}: TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td
      className={cn(
        "border-b border-[var(--border-faint)] px-3.5 py-2.5 align-middle text-[13px]",
        className,
      )}
      {...rest}
    >
      {children}
    </td>
  );
}

export function TrRow({
  children,
  failed,
  className,
}: {
  children: ReactNode;
  failed?: boolean;
  className?: string;
}) {
  return (
    <tr
      className={cn(
        "transition-colors",
        failed
          ? "bg-bad-soft/30 hover:bg-bad-soft/50"
          : "hover:bg-[#faf9f7]",
        className,
      )}
    >
      {children}
    </tr>
  );
}
