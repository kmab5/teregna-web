import { SiteHeader } from "@/components/teregna/site-header";
import { getUser } from "@/lib/supabase/server";
import { getT } from "@/i18n/server";
import { BrowseClient } from "./browse-client";

export const metadata = { title: "Browse providers — Teregna" };

export default async function BrowsePage() {
  const [user, t] = await Promise.all([getUser(), getT()]);
  return (
    <>
      <SiteHeader signedIn={Boolean(user)} />
      <main id="main" className="mx-auto max-w-6xl px-4 py-6 pb-24 md:py-10 md:pb-10">
        <h1 className="font-display text-2xl font-semibold">{t("browse.title")}</h1>
        <p className="mt-1 text-ink-muted">
          {t("browse.subtitle")}
        </p>
        <BrowseClient />
      </main>
    </>
  );
}
