import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/teregna/site-header";
import { getUser } from "@/lib/supabase/server";

/**
 * Onboarding needs a signed-in user but not the portal navigation: there is no
 * queue, archive or analytics to navigate to yet. It deliberately sits outside
 * the (portal) group so it gets this layout instead.
 */
export default async function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUser();
  if (!user) redirect("/provider/login?next=/provider/onboarding");

  return (
    <>
      <SiteHeader signedIn />
      <main id="main" className="mx-auto max-w-6xl px-4 py-10">
        {children}
      </main>
    </>
  );
}
