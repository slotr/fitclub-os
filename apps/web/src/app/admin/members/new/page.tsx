import Link from "next/link";
import { createMemberAction } from "../_actions";

export default function NewMemberPage() {
  return (
    <form
      action={async (fd) => {
        "use server";
        await createMemberAction(fd);
      }}
      className="mx-auto max-w-3xl space-y-6"
    >
      <div className="flex items-center justify-between">
        <h1 className="text-[22px] font-extrabold tracking-tighter">
          Onboard a new member
        </h1>
        <Link
          href={"/admin/members" as Parameters<typeof Link>[0]["href"]}
          className="text-[13px] text-fg-muted hover:text-fg"
        >
          Cancel
        </Link>
      </div>

      <Section
        title="Identity"
        hint="Full name and birthdate go on the membership card."
      >
        <Field name="fullName" label="Full name" required />
        <Field name="birthdate" label="Birthdate" type="date" />
      </Section>

      <Section title="Contact" hint="Used for receipts, reminders, OTP login.">
        <Field name="email" label="Email" type="email" required />
        <Field name="phone" label="Phone" type="tel" placeholder="+90 555 …" />
      </Section>

      <Section
        title="Membership plan"
        hint="Pick a plan now or skip and bill later from the detail page."
      >
        <Field
          name="planChoice"
          label="Plan"
          placeholder="Premium · ₺899 / month"
        />
        <Field name="startDate" label="Start date" type="date" />
      </Section>

      <Section title="First payment" hint="Optional. Stripe Checkout fires on save.">
        <Field
          name="firstAmount"
          label="Amount (₺)"
          type="number"
          placeholder="899"
        />
        <Field
          name="paymentMethod"
          label="Method"
          placeholder="Card on file ▾"
        />
      </Section>

      <div className="flex items-center justify-end gap-2 border-t border-[var(--border-color)] pt-4">
        <Link
          href={"/admin/members" as Parameters<typeof Link>[0]["href"]}
          className="inline-flex h-10 items-center rounded-sm border border-[var(--border-color)] bg-surface px-4 text-sm font-semibold hover:bg-[#faf9f7]"
        >
          Cancel
        </Link>
        <button
          type="submit"
          className="inline-flex h-10 items-center rounded-sm bg-fg px-5 text-sm font-semibold text-surface hover:opacity-90"
        >
          Create member
        </button>
      </div>
    </form>
  );
}

function Section({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-md bg-surface p-5 shadow-fc-1">
      <div className="mb-4 flex items-baseline justify-between gap-4">
        <h2 className="text-[15px] font-bold tracking-tightish">{title}</h2>
        {hint && <span className="text-[12px] text-fg-muted">{hint}</span>}
      </div>
      <div className="grid grid-cols-2 gap-4">{children}</div>
    </section>
  );
}

function Field({
  name,
  label,
  type = "text",
  placeholder,
  required,
}: {
  name: string;
  label: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
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
        required={required}
        className="block h-10 w-full rounded-sm border border-[var(--border-color)] bg-bg px-3 text-[13px] text-fg outline-none placeholder:text-fg-faint focus:border-fg"
      />
    </div>
  );
}
