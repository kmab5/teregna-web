import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { safeNext } from "@/lib/routes";

/**
 * OAuth / magic-link landing point.
 *
 * Google sends the browser back here with a `code`; we trade it for a session
 * cookie via PKCE and then return the person to wherever they were headed.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");

  // The person declined the Google consent screen, or Google refused. That is
  // a choice, not a failure - send them back to sign-in without an alarm.
  if (error) {
    const url = new URL("/login", origin);
    url.searchParams.set(
      "error",
      error === "access_denied" ? "cancelled" : "oauth",
    );
    if (errorDescription) url.searchParams.set("detail", errorDescription);
    return NextResponse.redirect(url);
  }

  if (!code) {
    return NextResponse.redirect(new URL("/login?error=oauth", origin));
  }

  const supabase = await createClient();
  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

  if (exchangeError) {
    return NextResponse.redirect(new URL("/login?error=oauth", origin));
  }

  // Sanitised so a crafted ?next cannot bounce someone off-site or back to a
  // login page.
  const next = safeNext(searchParams.get("next"), "/browse");

  /**
   * On Vercel the app sits behind a load balancer, so `origin` derived from
   * request.url is the internal host, not the domain the person typed. Sending
   * them there produces a dead redirect. `x-forwarded-host` carries the real
   * one. Locally there is no proxy, so origin is already correct.
   */
  const forwardedHost = request.headers.get("x-forwarded-host");
  const isLocal = process.env.NODE_ENV === "development";

  if (!isLocal && forwardedHost) {
    return NextResponse.redirect(`https://${forwardedHost}${next}`);
  }
  return NextResponse.redirect(`${origin}${next}`);
}
