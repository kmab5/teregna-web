"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import {
  Archive,
  ChartColumn,
  ExternalLink,
  ListOrdered,
  Moon,
  Package,
  Settings,
  Sun,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Mark } from "./logo";
import { MobileTabBar, type TabItem } from "./mobile-tab-bar";
import type { Provider } from "@/lib/database.types";

const NAV: TabItem[] = [
  { href: "/provider", label: "Queue", icon: ListOrdered },
  { href: "/provider/archive", label: "Archive", icon: Archive },
  { href: "/provider/items", label: "Items", icon: Package },
  { href: "/provider/analytics", label: "Analytics", icon: ChartColumn },
  { href: "/provider/settings", label: "Settings", icon: Settings },
];

/**
 * The provider's own chrome.
 *
 * Deliberately not the receiver header: these are two different jobs done in
 * two different postures - one is browsing, one is working a shift - and a
 * shared navigation bar made the app feel undifferentiated.
 *
 * On phones the five tabs move to a bottom bar. Laid out horizontally they
 * needed about 435px in a 343px space, and the row above them needed 396px, so
 * both overflowed. A provider is also usually holding the phone in one hand
 * with a customer in front of them, which is the stronger argument for putting
 * the controls under the thumb.
 */
export function ProviderShell({
  provider,
  children,
}: {
  provider: Provider | null;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { setTheme } = useTheme();

  return (
    <div className="min-h-dvh bg-bg">
      <header className="border-b border-chrome-border bg-chrome text-on-chrome">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-2 px-4">
          <Mark className="h-4 w-8 shrink-0 text-on-chrome" />

          {/* Truncates rather than pushing the status pill off-screen. A long
              business name is normal, not an edge case. */}
          <span className="min-w-0 truncate text-sm font-semibold">
            {provider?.name ?? "Your business"}
          </span>

          {provider ? (
            <span
              className={cn(
                "inline-flex shrink-0 items-center gap-1.5 rounded-full px-2 py-1 text-xs font-medium",
                provider.is_active
                  ? "bg-accent/25 text-on-chrome"
                  : "bg-chrome-border text-on-chrome-muted",
              )}
            >
              <span
                className={cn(
                  "size-1.5 rounded-full",
                  provider.is_active
                    ? "bg-accent animate-pulse-dot"
                    : "bg-on-chrome-muted",
                )}
                aria-hidden
              />
              {provider.is_active ? "Open" : "Closed"}
            </span>
          ) : null}

          <div className="ml-auto flex shrink-0 items-center gap-1">
            <button
              type="button"
              onClick={() =>
                setTheme(
                  document.documentElement.classList.contains("dark")
                    ? "light"
                    : "dark",
                )
              }
              aria-label="Switch theme"
              className="rounded-[var(--radius-sm)] p-2 text-on-chrome-muted transition-colors hover:bg-chrome-border hover:text-on-chrome"
            >
              <Moon className="size-4 dark:hidden" aria-hidden />
              <Sun className="hidden size-4 dark:block" aria-hidden />
            </button>

            {/* A provider is also someone who can queue elsewhere. Icon-only on
                phones, where the label cost 100px it did not have. */}
            <Link
              href="/browse"
              aria-label="Customer view"
              className="inline-flex items-center gap-1.5 rounded-[var(--radius-sm)] p-2 text-xs font-medium text-on-chrome-muted transition-colors hover:bg-chrome-border hover:text-on-chrome sm:px-3"
            >
              <span className="hidden sm:inline">Customer view</span>
              <ExternalLink className="size-4 sm:size-3" aria-hidden />
            </Link>
          </div>
        </div>

        {/* Tabs on desktop only; phones get the bottom bar. */}
        <nav aria-label="Provider" className="mx-auto hidden max-w-6xl px-4 md:block">
          <ul className="flex gap-1">
            {NAV.map(({ href, label, icon: Icon }) => {
              const active = pathname === href;
              return (
                <li key={href}>
                  <Link
                    href={href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex shrink-0 items-center gap-2 border-b-2 px-3 py-2.5 text-sm font-medium transition-colors",
                      active
                        ? "border-chrome-active text-chrome-active"
                        : "border-transparent text-on-chrome-muted hover:text-on-chrome",
                    )}
                  >
                    <Icon className="size-4" aria-hidden />
                    {label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </header>

      <main id="main" className="mx-auto max-w-6xl px-4 py-6 md:py-8">
        {children}
      </main>

      <MobileTabBar tabs={NAV} />
      {/* Reserves the bar's height so the last control on a page stays tappable. */}
      <div aria-hidden className="h-14 pb-[env(safe-area-inset-bottom)] md:hidden" />
    </div>
  );
}
