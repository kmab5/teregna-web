import { cookies } from "next/headers";
import { DEFAULT_LOCALE, isLocale, LOCALE_COOKIE, type Locale } from "./config";
import { en } from "./messages/en";
import { am } from "./messages/am";
import type { Messages } from "./messages/en";

export const CATALOGUES: Record<Locale, Messages> = { en, am };

/**
 * The active locale, from a cookie.
 *
 * A cookie rather than a URL segment on purpose: `/am/...` prefixes would have
 * meant reworking the route guards in proxy.ts, `safeNext`, and every OAuth
 * redirect URL already registered with Google and Supabase. The cost of that
 * churn is real and the benefit - per-locale URLs for search engines - can be
 * added later without changing any of this code.
 */
export async function getLocale(): Promise<Locale> {
  const store = await cookies();
  const value = store.get(LOCALE_COOKIE)?.value;
  return isLocale(value) ? value : DEFAULT_LOCALE;
}

export async function getMessages(): Promise<Messages> {
  return CATALOGUES[await getLocale()];
}
