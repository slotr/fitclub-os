"use client";

export function TopbarSearch() {
  return (
    <div className="hidden h-8 max-w-[360px] flex-1 items-center gap-2 rounded-sm bg-[#f5f4f1] px-3 text-xs text-fg-muted md:flex">
      <span className="flex-1 truncate">
        Search members, classes, payments…
      </span>
      <kbd className="rounded border border-[var(--border-color)] bg-surface px-1.5 py-0.5 font-mono text-[10px] text-fg-muted">
        ⌘K
      </kbd>
    </div>
  );
}
