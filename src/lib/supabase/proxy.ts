import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { guardFor } from "@/lib/routes";

/**
 * Refreshes the auth session on every request and guards the routes that
 * require one.
 *
 * Route guards are convenience. RLS decides what any request can actually read
 * or write, regardless of what the router allows.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const { pathname, search } = request.nextUrl;
  const guard = guardFor(pathname);

  // Public and unguarded paths still get their session refreshed - they are
  // just never redirected.
  if (!guard) return response;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) return response;

  // Built from scratch on purpose. Cloning nextUrl would carry the existing
  // query string, so each hop would nest another ?next= inside the last one.
  const url = new URL(
    guard === "provider" ? "/provider/login" : "/login",
    request.url,
  );
  url.searchParams.set("next", pathname + search);
  return NextResponse.redirect(url);
}
