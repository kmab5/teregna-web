"use client";

import { createContext, useContext, useMemo } from "react";
import { createTranslator, type Translator } from "./translate";
import { DEFAULT_LOCALE, type Locale } from "./config";
import type { Messages } from "./messages/en";

const I18nContext = createContext<{ locale: Locale; messages: Messages } | null>(
  null,
);

/**
 * Messages are handed down from the server layout rather than imported in the
 * client, so only the active catalogue ships to the browser - not both.
 */
export function I18nProvider({
  locale,
  messages,
  children,
}: {
  locale: Locale;
  messages: Messages;
  children: React.ReactNode;
}) {
  const value = useMemo(() => ({ locale, messages }), [locale, messages]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

/** The translator, for client components. */
export function useT(): Translator {
  const ctx = useContext(I18nContext);
  return useMemo(() => {
    if (!ctx) {
      throw new Error("useT must be used inside <I18nProvider>");
    }
    return createTranslator(ctx.locale, ctx.messages);
  }, [ctx]);
}

export function useLocale(): Locale {
  return useContext(I18nContext)?.locale ?? DEFAULT_LOCALE;
}
