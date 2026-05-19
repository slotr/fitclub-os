import Link from "next/link";
import { signInAction } from "./actions";

async function submit(formData: FormData) {
  "use server";
  await signInAction(formData);
}

export default function LoginPage() {
  return (
    <main className="grid min-h-dvh place-items-center bg-warm-cream p-6">
      <div className="w-full max-w-[400px]">
        <form
          action={submit}
          className="flex flex-col rounded-lg bg-surface p-8 shadow-fc-3"
        >
          <div className="mb-5 flex items-center justify-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-amber" />
            <span className="text-lg font-extrabold tracking-tighter">
              FitClub
            </span>
          </div>

          <h1 className="text-[22px] font-extrabold tracking-tighter">
            Admin sign in
          </h1>
          <p className="mb-5 mt-1 text-[13px] text-fg-muted">
            Use your email and password to continue.
          </p>

          <Field name="email" type="email" label="Email" placeholder="admin@fitclub.demo" />
          <Field name="password" type="password" label="Password" placeholder="••••••••••" />

          <div className="my-2 flex items-center justify-between text-xs">
            <label className="inline-flex items-center gap-1.5 text-fg">
              <input
                type="checkbox"
                name="remember"
                defaultChecked
                className="h-3.5 w-3.5 accent-amber"
              />
              Remember me
            </label>
            <Link
              href={"/login" as Parameters<typeof Link>[0]["href"]}
              className="font-medium text-fg-muted hover:underline"
            >
              Forgot password?
            </Link>
          </div>

          <button
            type="submit"
            className="mt-2 inline-flex h-11 items-center justify-center rounded-md bg-fg text-sm font-semibold text-surface transition-transform hover:-translate-y-px"
          >
            Sign in
          </button>

          <div className="mt-3 text-center text-xs text-fg-muted">
            or{" "}
            <Link
              href={"/login" as Parameters<typeof Link>[0]["href"]}
              className="text-fg underline underline-offset-2"
            >
              use a magic link
            </Link>
          </div>
        </form>
      </div>
    </main>
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
    <div className="mb-3">
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
        required
        className="block h-[38px] w-full rounded-sm border border-[var(--border-color)] bg-bg px-3 text-[13px] text-fg outline-none placeholder:text-fg-faint focus:border-fg"
      />
    </div>
  );
}
