"use client";

import { useState } from "react";
import Image from "next/image";
import { getClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

/**
 * Sign in with Google.
 *
 * On the official mark: Google's brand guidelines require their own asset, and
 * a hand-drawn imitation risks failing their OAuth verification review as well
 * as being a trademark reproduction. So this ships text-only by default and
 * renders the real mark the moment you drop it in at
 * `public/google-mark.svg` - download it from
 * https://developers.google.com/identity/branding-guidelines
 */
export function GoogleButton({
  next,
  label = "Continue with Google",
  hasOfficialMark = false,
}: {
  /** Where to land after the round trip. Already sanitised by the caller. */
  next: string;
  label?: string;
  hasOfficialMark?: boolean;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function signIn() {
    setBusy(true);
    setError(null);

    const { error } = await getClient().auth.signInWithOAuth({
      provider: "google",
      options: {
        // Must be on the Supabase redirect allow list, or Google returns to a
        // Supabase error page instead of here.
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
        queryParams: {
          // Always show the chooser. Someone signing in on a shared phone
          // should not be silently logged into whoever used it last.
          prompt: "select_account",
        },
      },
    });

    if (error) {
      setBusy(false);
      setError("Google sign-in is unavailable right now. Use your email instead.");
      return;
    }
    // On success the browser navigates away; leave the button busy.
  }

  return (
    <div className="space-y-2">
      <Button
        type="button"
        variant="outline"
        size="lg"
        className="w-full"
        onClick={signIn}
        disabled={busy}
      >
        {hasOfficialMark ? (
          <Image src="/google-mark.svg" alt="" width={18} height={18} aria-hidden />
        ) : null}
        {busy ? "Taking you to Google…" : label}
      </Button>

      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}

/** "or" rule between the OAuth button and the email form. */
export function AuthDivider() {
  return (
    <div className="flex items-center gap-3" aria-hidden>
      <span className="h-px flex-1 bg-border" />
      <span className="text-xs uppercase tracking-wide text-ink-muted">or</span>
      <span className="h-px flex-1 bg-border" />
    </div>
  );
}
