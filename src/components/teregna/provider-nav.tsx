"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ListOrdered,
  Archive,
  Package,
  ChartColumn,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/provider", label: "Queue", icon: ListOrdered },
  { href: "/provider/archive", label: "Archive", icon: Archive },
  { href: "/provider/items", label: "Items", icon: Package },
  { href: "/provider/analytics", label: "Analytics", icon: ChartColumn },
  { href: "/provider/settings", label: "Settings", icon: Settings },
];

export function ProviderNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Provider"
      className="flex gap-1 overflow-x-auto border-b border-border pb-px md:flex-col md:overflow-visible md:border-b-0 md:border-r md:pb-0 md:pr-4"
    >
      {NAV.map(({ href, label, icon: Icon }) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex shrink-0 items-center gap-2 rounded-[var(--radius-sm)] px-3 py-2.5 text-sm font-medium transition-colors",
              active
                ? "bg-primary/10 text-primary"
                : "text-ink-muted hover:bg-muted hover:text-ink",
            )}
          >
            <Icon className="size-4" aria-hidden />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
