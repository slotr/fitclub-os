import { createSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { TopbarSearch } from "./cmd-search";
import { PlusIcon } from "./icons";
import { Breadcrumb } from "./breadcrumb";

async function signOutAction() {
  "use server";
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/login");
}

function initials(email?: string | null) {
  if (!email) return "?";
  const local = email.split("@")[0] ?? "";
  const parts = local.split(/[._-]/).filter(Boolean);
  const a = parts[0]?.[0];
  const b = parts[1]?.[0];
  if (parts.length >= 2 && a && b) return (a + b).toUpperCase();
  return local.slice(0, 2).toUpperCase();
}

export async function Topbar() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  return (
    <header className="flex h-14 items-center gap-4 border-b border-[var(--border-color)] bg-surface px-6">
      <Breadcrumb />
      <TopbarSearch />
      <form action={signOutAction} className="ml-auto">
        <button
          className="text-xs font-medium text-fg-muted hover:text-fg"
          type="submit"
        >
          Sign out
        </button>
      </form>
      <button className="inline-flex h-8 items-center gap-1.5 rounded-sm bg-fg px-3 text-xs font-semibold text-surface hover:opacity-90">
        <PlusIcon className="h-3.5 w-3.5" />
        New
      </button>
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-soft text-xs font-bold text-fg">
        {initials(data.user?.email)}
      </div>
    </header>
  );
}
