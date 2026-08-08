"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useMyProvider } from "@/lib/queries";
import { ProviderShell } from "@/components/teregna/provider-shell";

/**
 * Wraps every portal page in the provider chrome, and sends anyone without a
 * business to onboarding before they can reach a screen that assumes one.
 */
export function ProviderPortalChrome({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { data: provider, isPending } = useMyProvider();

  useEffect(() => {
    if (!isPending && provider === null) router.replace("/provider/onboarding");
  }, [provider, isPending, router]);

  return <ProviderShell provider={provider ?? null}>{children}</ProviderShell>;
}
