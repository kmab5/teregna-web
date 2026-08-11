"use client";

import { useTransition } from "react";
import { Languages } from "lucide-react";
import { setLocale } from "@/i18n/actions";
import { LOCALES, LOCALE_LABELS } from "@/i18n/config";
import { useLocale, useT } from "@/i18n/client";
import { cn } from "@/lib/utils";

/**
 * Language switcher.
 *
 * Two locales, so a segmented control beats a dropdown: both options are
 * visible and it is one tap, not two. The label of each option is written in
 * its own language - someone who cannot read the current UI language can still
 * find their way out.
 */
export function LanguageSwitcher({
  className,
  compact = false,
}: {
  className?: string;
  compact?: boolean;
}) {
  const locale = useLocale();
  const t = useT();
  const [pending, startTransition] = useTransition();

  return (
    <div
      className={cn("inline-flex items-center gap-1.5", className)}
      role="group"
      aria-label={t("common.language")}
    >
      {!compact ? (
        <Languages className="size-4 text-ink-muted" aria-hidden />
      ) : null}
      <div className="inline-flex rounded-full bg-muted p-0.5">
        {LOCALES.map((code) => (
          <button
            key={code}
            type="button"
            lang={code}
            onClick={() => startTransition(() => setLocale(code))}
            disabled={pending || code === locale}
            aria-pressed={code === locale}
            className={cn(
              "rounded-full px-2.5 py-1 text-xs font-medium transition-colors disabled:cursor-default",
              code === locale
                ? "bg-surface text-ink elev-1"
                : "text-ink-muted hover:text-ink",
              code === "am" && "am",
            )}
          >
            {LOCALE_LABELS[code]}
          </button>
        ))}
      </div>
    </div>
  );
}
