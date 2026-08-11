"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { Compass, ListChecks, Moon, Store, Sun, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo, Mark } from "./logo";
import { MobileTabBar, type TabItem } from "./mobile-tab-bar";
import { useT } from "@/i18n/client";
import { cn } from "@/lib/utils";

const TABS: TabItem[] = [
  { href: "/browse", label: "nav.browse", icon: Compass },
  { href: "/requests", label: "nav.myRequests", icon: ListChecks },
  { href: "/provider", label: "nav.myBusiness", icon: Store, matchNested: true },
  { href: "/account", label: "nav.account", icon: UserRound },
];

export function SiteHeader({ signedIn }: { signedIn: boolean }) {
  const pathname = usePathname();
  const { setTheme } = useTheme();
  const t = useT();

  const desktopLinks = signedIn
    ? [
        { href: "/browse", label: "nav.browse" },
        { href: "/requests", label: "nav.myRequests" },
        { href: "/account", label: "nav.account" },
      ]
    : [{ href: "/browse", label: "nav.browse" }];

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-border bg-bg/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-2 px-4">
          <Link href="/" aria-label={t("nav.home")} className="shrink-0">
            {/* The wordmark is dropped below 400px, where it was the difference
                between fitting and overflowing. The mark alone still reads. */}
            <Logo className="hidden min-[400px]:inline-flex" />
            <Mark className="h-5 w-10 text-primary min-[400px]:hidden" />
          </Link>

          {/* Navigation lives in the bottom bar on phones. */}
          <nav className="ml-2 hidden items-center gap-1 md:flex" aria-label={t("nav.main")}>
            {desktopLinks.map((l) => (
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
                {t(l.label as never)}
              </Link>
            ))}
          </nav>

          <div className="ml-auto flex shrink-0 items-center gap-1.5">
            <button
              type="button"
              onClick={() =>
                setTheme(
                  document.documentElement.classList.contains("dark")
                    ? "light"
                    : "dark",
                )
              }
              aria-label={t("common.switchTheme")}
              className="rounded-[var(--radius-sm)] p-2.5 text-ink-muted transition-colors hover:bg-muted hover:text-ink"
            >
              <Moon className="size-4 dark:hidden" aria-hidden />
              <Sun className="hidden size-4 dark:block" aria-hidden />
            </button>

            {signedIn ? (
              <Button asChild variant="outline" size="sm" className="hidden md:inline-flex">
                <Link href="/provider">{t("nav.businessDashboard")}</Link>
              </Button>
            ) : (
              <>
                <Button asChild variant="ghost" size="sm">
                  <Link href="/login">{t("nav.signIn")}</Link>
                </Button>
                {/* Full label on desktop, short on phones - "For providers" was
                    170px of a 343px bar on its own. */}
                <Button asChild size="sm">
                  <Link href="/provider/login">
                    <span className="hidden sm:inline">{t("nav.forProviders")}</span>
                    <span className="sm:hidden">{t("nav.forProvidersShort")}</span>
                  </Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {signedIn ? <MobileTabBar tabs={TABS} /> : null}
    </>
  );
}
