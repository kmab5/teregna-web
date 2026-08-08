"use client";

import { useTheme } from "next-themes";
import { Toaster } from "sonner";

/**
 * Toasts, themed.
 *
 * Sonner hardcodes the description colour to #3f3f3f and only corrects it when
 * its OWN `data-sonner-theme` attribute says dark. Without the `theme` prop it
 * stays on light defaults forever, so in dark mode the description rendered at
 * 1.61:1 against our surface - technically present, practically unreadable.
 *
 * Two things fix it, and both are needed:
 *   1. `theme` tells sonner which of its internal palettes to use, which also
 *      covers the close button and icons.
 *   2. `classNames` pins every colour to our own tokens, so a future sonner
 *      grey cannot drift away from the brand.
 *
 * `resolvedTheme` is undefined on the first render, which is harmless here:
 * a toast only ever appears in response to an action, long after mount.
 */
export function BrandToaster() {
  const { resolvedTheme } = useTheme();

  return (
    <Toaster
      position="top-center"
      theme={resolvedTheme === "dark" ? "dark" : "light"}
      closeButton
      toastOptions={{
        // Tailwind v4 puts the important modifier at the END of the class
        // (`text-ink!`), not the start. The v3 prefix form silently generates
        // nothing, which would leave sonner's hardcoded colours in place.
        classNames: {
          toast:
            "bg-surface! text-ink! border-border! rounded-[var(--radius-md)]! elev-2",
          title: "text-ink! font-medium!",
          description: "text-ink-muted!",
          actionButton: "bg-primary! text-on-primary!",
          cancelButton: "bg-muted! text-ink!",
          closeButton: "bg-surface! text-ink-muted! border-border!",
          success: "text-ink!",
          error: "text-ink!",
          info: "text-ink!",
          warning: "text-ink!",
        },
      }}
    />
  );
}
