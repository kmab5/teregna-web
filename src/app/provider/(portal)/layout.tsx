import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/teregna/site-header";
import { ProviderNav } from "@/components/teregna/provider-nav";
import { getUser } from "@/lib/supabase/server";

/**
 * Guards the authenticated portal.
 *
 * This lives in a (portal) route group on purpose. When it sat directly at
 * /provider it also wrapped /provider/login, so a signed-out visitor was
 * redirected from the login page to the login page - forever. Route groups do
 * not change URLs, so /provider, /provider/archive and the rest are unaffected.
 *
 * Anything under this directory requires a session. Anything that a signed-out
 * person needs (login) must stay outside it.
 */
export default async function ProviderPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUser();
  if (!user) redirect("/provider/login");

  return (
    <>
      <SiteHeader signedIn />
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="grid gap-6 md:grid-cols-[190px_1fr]">
          <ProviderNav />
          <main id="main" className="min-w-0">{children}</main>
        </div>
      </div>
    </>
  );
}
