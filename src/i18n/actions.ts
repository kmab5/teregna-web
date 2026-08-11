"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { LOCALE_COOKIE, isLocale, type Locale } from "./config";

/**
 * Persist the language choice.
 *
 * A cookie rather than a URL segment, so every existing route, redirect and
 * OAuth callback keeps working. One year, lax - it is a display preference,
 * not a credential.
 */
export async function setLocale(locale: Locale) {
  if (!isLocale(locale)) return;
  const store = await cookies();
  store.set(LOCALE_COOKIE, locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
  revalidatePath("/", "layout");
}
