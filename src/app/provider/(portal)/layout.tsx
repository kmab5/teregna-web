import { redirect } from "next/navigation";
import { getUser } from "@/lib/supabase/server";
import { ProviderPortalChrome } from "./portal-chrome";

/**
 * Guards the authenticated portal.
 *
 * This lives in a (portal) route group on purpose. When it sat directly at
 * /provider it also wrapped /provider/login, so a signed-out visitor was
 * redirected from the login page to the login page - forever. Route groups do
 * not change URLs, so /provider, /provider/archive and the rest are unaffected.
 *
 * Anything a signed-out person needs (login) must stay outside this directory.
 */
export default async function ProviderPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUser();
  if (!user) redirect("/provider/login");

  return <ProviderPortalChrome>{children}</ProviderPortalChrome>;
}
