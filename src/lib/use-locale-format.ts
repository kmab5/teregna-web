"use client";

import { useMemo } from "react";
import { useLocale } from "@/i18n/client";
import { INTL_LOCALE } from "@/i18n/config";

/**
 * Locale-aware formatting.
 *
 * Dates, currency and numbers go through Intl with the active locale, so
 * Amharic gets Ethiopian conventions rather than English ones with translated
 * labels bolted on.
 */
export function useLocaleFormat() {
  const locale = useLocale();
  const intl = INTL_LOCALE[locale];

  return useMemo(
    () => ({
      locale,
      intl,
      money(value: number | null | undefined, currency = "ETB") {
        if (value === null || value === undefined) return "—";
        try {
          return new Intl.NumberFormat(intl, {
            style: "currency",
            currency,
            maximumFractionDigits: 0,
          }).format(value);
        } catch {
          return `${currency} ${value.toFixed(0)}`;
        }
      },
      dateTime(iso: string | null) {
        if (!iso) return "—";
        return new Intl.DateTimeFormat(intl, {
          dateStyle: "medium",
          timeStyle: "short",
        }).format(new Date(iso));
      },
      day(iso: string) {
        return new Intl.DateTimeFormat(intl, {
          month: "short",
          day: "numeric",
        }).format(new Date(iso));
      },
      percent(rate: number | null) {
        if (rate === null) return "—";
        return new Intl.NumberFormat(intl, {
          style: "percent",
          maximumFractionDigits: 0,
        }).format(rate);
      },
      number(value: number) {
        return new Intl.NumberFormat(intl).format(value);
      },
    }),
    [locale, intl],
  );
}
