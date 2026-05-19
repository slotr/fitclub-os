import Link from "next/link";
import { stubSessionAction } from "../_actions";

export default function NewClassSessionPage() {
  return (
    <form
      action={async (fd) => {
        "use server";
        await stubSessionAction(fd);
      }}
      className="mx-auto max-w-2xl space-y-6"
    >
      <div className="flex items-center justify-between">
        <h1 className="text-[22px] font-extrabold tracking-tighter">
          New class session
        </h1>
        <Link
          href={"/admin/classes" as Parameters<typeof Link>[0]["href"]}
          className="text-[13px] text-fg-muted hover:text-fg"
        >
          Cancel
        </Link>
      </div>

      <Section title="When">
        <Field name="startsAt" type="datetime-local" label="Start" />
        <Field name="durationMin" type="number" label="Duration (min)" placeholder="60" />
      </Section>

      <Section title="What">
        <Field name="className" label="Class" placeholder="Yoga Flow" />
        <Field name="instructor" label="Instructor" placeholder="Ayşe" />
      </Section>

      <Section title="Where">
        <Field name="room" label="Room" placeholder="Studio A" />
        <Field name="capacity" type="number" label="Capacity" placeholder="12" />
      </Section>

      <div className="flex justify-end gap-2 border-t border-[var(--border-color)] pt-4">
        <Link
          href={"/admin/classes" as Parameters<typeof Link>[0]["href"]}
          className="inline-flex h-10 items-center rounded-sm border border-[var(--border-color)] bg-surface px-4 text-sm font-semibold hover:bg-[#faf9f7]"
        >
          Cancel
        </Link>
        <button
          type="submit"
          className="inline-flex h-10 items-center rounded-sm bg-fg px-5 text-sm font-semibold text-surface hover:opacity-90"
        >
          Create session
        </button>
      </div>
    </form>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-md bg-surface p-5 shadow-fc-1">
      <h2 className="mb-4 text-[15px] font-bold tracking-tightish">{title}</h2>
      <div className="grid grid-cols-2 gap-4">{children}</div>
    </section>
  );
}

function Field({
  name,
  label,
  type = "text",
  placeholder,
}: {
  name: string;
  label: string;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div>
      <label
        htmlFor={name}
        className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider2 text-fg-muted"
      >
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        placeholder={placeholder}
        className="block h-10 w-full rounded-sm border border-[var(--border-color)] bg-bg px-3 text-[13px] text-fg outline-none placeholder:text-fg-faint focus:border-fg"
      />
    </div>
  );
}
