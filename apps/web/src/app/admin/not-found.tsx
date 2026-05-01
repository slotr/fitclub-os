import Link from "next/link";

export default function AdminNotFound() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="max-w-md text-center">
        <div className="font-mono text-[11px] font-semibold uppercase tracking-wider2 text-fg-muted">
          404 · Not found
        </div>
        <h1 className="mt-2 text-[28px] font-extrabold tracking-tighter">
          Empty room.
        </h1>
        <p className="mt-2 text-[14px] text-fg-muted">
          The page you tried to open doesn't exist — or got moved while you
          were away. Try the dashboard.
        </p>
        <div className="mt-6 flex justify-center gap-2">
          <Link
            href={"/admin" as Parameters<typeof Link>[0]["href"]}
            className="inline-flex h-10 items-center rounded-sm bg-fg px-5 text-sm font-semibold text-surface hover:opacity-90"
          >
            Back to dashboard
          </Link>
          <Link
            href={"/admin/members" as Parameters<typeof Link>[0]["href"]}
            className="inline-flex h-10 items-center rounded-sm border border-[var(--border-color)] bg-surface px-5 text-sm font-semibold hover:bg-[#faf9f7]"
          >
            Members
          </Link>
        </div>
      </div>
    </div>
  );
}
