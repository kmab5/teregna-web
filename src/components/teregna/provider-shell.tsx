"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import {
  Moon,
  Sun,
  ListOrdered,
  Archive,
  Package,
  ChartColumn,
  Settings,
  ExternalLink,
} from "lucide-react";
import { Mark } from "./logo";
import { cn } from "@/lib/utils";
import type { Provider } from "@/lib/database.types";

const NAV = [
  { href: "/provider", label: "Queue", icon: ListOrdered },
  { href: "/provider/archive", label: "Archive", icon: Archive },
  { href: "/provider/items", label: "Items", icon: Package },
  { href: "/provider/analytics", label: "Analytics", icon: ChartColumn },
  { href: "/provider/settings", label: "Settings", icon: Settings },
];

/**
 * The provider's own chrome.
 *
 * Deliberately not the receiver header. These are two different jobs done by
 * two different people in two different postures - one is browsing, one is
 * working a shift - and sharing a navigation bar made the app feel like a
 * single undifferentiated dashboard. This one is darker, denser, names the
 * business rather than the product, and carries an open/closed indicator that
 * the receiver side has no concept of.
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
    <div className="min-h-dvh bg-surface-2">
      <header className="border-b border-border bg-ink text-white">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-4 px-4">
          <span className="flex items-center gap-2.5 text-sm font-semibold">
            <Mark className="h-4 w-8 text-white/80" />
            {provider?.name ?? "Your business"}
          </span>

          {provider ? (
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
                provider.is_active
                  ? "bg-accent/20 text-white"
                  : "bg-white/15 text-white/80",
              )}
            >
              <span
                className={cn(
                  "size-1.5 rounded-full",
                  provider.is_active ? "bg-accent animate-pulse-dot" : "bg-white/60",
                )}
                aria-hidden
              />
              {provider.is_active ? "Open" : "Closed"}
            </span>
          ) : null}

          <div className="ml-auto flex items-center gap-1">
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
              className="rounded-[var(--radius-sm)] p-2 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
            >
              <Moon className="size-4 dark:hidden" aria-hidden />
              <Sun className="hidden size-4 dark:block" aria-hidden />
            </button>

            {/* A provider is also a person who can queue elsewhere. */}
            <Link
              href="/browse"
              className="inline-flex items-center gap-1.5 rounded-[var(--radius-sm)] px-3 py-2 text-xs font-medium text-white/70 transition-colors hover:bg-white/10 hover:text-white"
            >
              Customer view
              <ExternalLink className="size-3" aria-hidden />
            </Link>
          </div>
        </div>

        <nav aria-label="Provider" className="mx-auto max-w-6xl px-4">
          <ul className="flex gap-1 overflow-x-auto">
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
                        ? "border-white text-white"
                        : "border-transparent text-white/60 hover:text-white",
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

      <main id="main" className="mx-auto max-w-6xl px-4 py-8">
        {children}
      </main>
    </div>
  );
}
