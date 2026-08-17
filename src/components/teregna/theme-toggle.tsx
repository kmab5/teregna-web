"use client";

import { useTheme } from "next-themes";
import { Monitor, Moon, Sun } from "lucide-react";
import { useT } from "@/i18n/client";
import { cn } from "@/lib/utils";

const OPTIONS = [
  { value: "light", labelKey: "theme.light", icon: Sun },
  { value: "dark", labelKey: "theme.dark", icon: Moon },
  { value: "system", labelKey: "theme.system", icon: Monitor },
] as const;

/**
 * Three options, not a switch.
 *
 * "Follow my system" is a real preference — someone whose OS flips at dusk
 * expects the app to follow. A two-state toggle silently converts that into a
 * fixed choice the first time it is touched, and there is no way back to it.
 */
export function ThemeToggle() {
  const t = useT();
  const { theme, setTheme } = useTheme();

  return (
    <div
      role="radiogroup"
      aria-label={t("theme.title")}
      className="inline-flex gap-1 rounded-full bg-muted p-1"
    >
      {OPTIONS.map(({ value, labelKey, icon: Icon }) => {
        const active = theme === value;
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => setTheme(value)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
              active
                ? "bg-surface text-ink elev-1"
                : "text-ink-muted hover:text-ink",
            )}
          >
            <Icon className="size-4" aria-hidden />
            {t(labelKey)}
          </button>
        );
      })}
    </div>
  );
}
