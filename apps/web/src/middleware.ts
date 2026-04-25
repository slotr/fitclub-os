import { NextResponse, type NextRequest } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll(
          toSet: { name: string; value: string; options: CookieOptions }[],
        ) {
          for (const { name, value, options } of toSet) {
            res.cookies.set({ name, value, ...options });
          }
        },
      },
    },
  );
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isAdminRoute = req.nextUrl.pathname.startsWith("/admin");
  if (isAdminRoute && !user) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", req.nextUrl.pathname);
    return NextResponse.redirect(url);
  }
  return res;
}

export const config = {
  matcher: ["/admin/:path*"],
};
