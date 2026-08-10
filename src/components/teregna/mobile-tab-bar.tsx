"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface TabItem {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Match nested routes too. Off by default so /provider does not match all. */
  matchNested?: boolean;
}

/**
 * Bottom navigation, phones only.
 *
 * A horizontal top nav needed roughly 600px to lay out and had 343px, so it
 * overflowed. Shrinking it would have produced targets too small to hit.
 *
 * Bottom placement is not just a way to find room: the two things people do
 * most here - a receiver checking their position, a provider finishing the
 * next request - happen one-handed while standing up. The thumb reaches the
 * bottom of the screen, not the top.
 */
export function MobileTabBar({ tabs }: { tabs: TabItem[] }) {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Main"
      className={cn(
        "fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface md:hidden",
        // Clears the iOS home indicator. Without it the last row of targets
        // sits under the system gesture area and becomes unusable.
        "pb-[env(safe-area-inset-bottom)]",
      )}
    >
      <ul className="flex">
        {tabs.map(({ href, label, icon: Icon, matchNested }) => {
          const active = matchNested
            ? pathname === href || pathname.startsWith(`${href}/`)
            : pathname === href;
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  // 56px tall: comfortably past the 44px minimum target.
                  "flex h-14 flex-col items-center justify-center gap-0.5 text-[0.6875rem] font-medium transition-colors",
                  active ? "text-primary" : "text-ink-muted",
                )}
              >
                <Icon className="size-5" aria-hidden />
                <span className="max-w-full truncate px-1">{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/**
 * Spacer that reserves the height of the bar, so the last element on a page is
 * not permanently hidden behind it.
 */
export function MobileTabBarSpacer() {
  return (
    <div
      aria-hidden
      className="h-14 pb-[env(safe-area-inset-bottom)] md:hidden"
    />
  );
}
