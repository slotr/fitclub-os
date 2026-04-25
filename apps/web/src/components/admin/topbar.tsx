import { createSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

async function signOutAction() {
  "use server";
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function Topbar() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  return (
    <header className="flex items-center justify-between border-b bg-white px-6 py-3">
      <div className="text-sm text-neutral-600">{data.user?.email}</div>
      <form action={signOutAction}>
        <button className="text-sm text-neutral-600 hover:text-neutral-900">
          Sign out
        </button>
      </form>
    </header>
  );
}
