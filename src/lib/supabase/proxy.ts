import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
* Refreshes the auth session on every request and guards the routes that
 * require a session.
 *
 * Hidden routes are convenience, not security. RLS decides what any request
 * can actually read or write, regardless of what the router allows.
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

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname, search } = request.nextUrl;
  const needsProvider = pathname.startsWith("/provider");
  const needsReceiver = pathname.startsWith("/requests");

  if (!user && (needsProvider || needsReceiver)) {
    const url = request.nextUrl.clone();
    url.pathname = needsProvider ? "/provider/login" : "/login";
    url.searchParams.set("next", pathname + search);
    return NextResponse.redirect(url);
  }

  return response;
}
