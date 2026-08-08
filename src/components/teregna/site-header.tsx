"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { Logo } from "./logo";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function SiteHeader({ signedIn }: { signedIn: boolean }) {
  const pathname = usePathname();
  const { setTheme } = useTheme();

  const links = [
    { href: "/browse", label: "Browse" },
    ...(signedIn
      ? [
          { href: "/requests", label: "My requests" },
          { href: "/account", label: "Account" },
        ]
      : []),
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-bg/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4">
        <Link href="/" aria-label="Teregna home">
          <Logo />
        </Link>

        <nav className="ml-2 flex items-center gap-1" aria-label="Main">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              aria-current={pathname === l.href ? "page" : undefined}
              className={cn(
                "rounded-[var(--radius-sm)] px-3 py-2 text-sm font-medium transition-colors",
                pathname === l.href
                  ? "bg-muted text-ink"
                  : "text-ink-muted hover:bg-muted hover:text-ink",
              )}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
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
            className="rounded-[var(--radius-sm)] p-2.5 text-ink-muted transition-colors hover:bg-muted hover:text-ink"
          >
            {/* Both render; CSS picks one. No mount flag, so no hydration
                flash and no cascading render. */}
            <Moon className="size-4 dark:hidden" aria-hidden />
            <Sun className="hidden size-4 dark:block" aria-hidden />
          </button>

          {signedIn ? (
            <Button asChild variant="outline" size="sm">
              <Link href="/provider">Business dashboard</Link>
            </Button>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link href="/login">Sign in</Link>
              </Button>
              <Button asChild size="sm">
                <Link href="/provider/login">For providers</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
