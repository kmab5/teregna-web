/**
 * Route classification. Deliberately free of Next imports so it stays pure and
 * testable in isolation - and so nothing here can depend on request context.
 */

/**
 * Paths that must never be guarded.
 *
 * The provider auth page lives under /provider, so a naive
 * `pathname.startsWith("/provider")` guard sends a signed-out visitor from
 * /provider/login to /provider/login - forever. Anything a signed-out person
 * needs in order to sign in belongs on this list.
 */
export const PUBLIC_PREFIXES = [
  "/login",
  "/signup",
  "/provider/login",
  "/auth", // OAuth / magic-link callback and signout
] as const;

export function isPublicPath(pathname: string): boolean {
  return PUBLIC_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
}

/** Routes that require a session, and which door to send people to. */
export function guardFor(pathname: string): "provider" | "receiver" | null {
  if (isPublicPath(pathname)) return null;
  if (pathname.startsWith("/provider")) return "provider";
  if (pathname.startsWith("/requests")) return "receiver";
  return null;
}

/**
 * Where to send someone after they sign in.
 *
 * Never an auth page: that bounces them straight back to the form they just
 * completed. Never an absolute or protocol-relative URL either - an
 * attacker-supplied `?next=https://evil.example` would make this an open
 * redirect.
 */
export function safeNext(next: string | null, fallback: string): string {
  if (!next) return fallback;
  if (!next.startsWith("/") || next.startsWith("//")) return fallback;
  if (isPublicPath(next.split("?")[0])) return fallback;
  return next;
}
