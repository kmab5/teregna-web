"use client";

import { useState } from "react";
import Image from "next/image";
import { getClient } from "@/lib/supabase/client";

/**
 * Sign in with Google, using Google's own pre-approved button asset.
 *
 * Google ships the whole button - background, logo, type - not just the mark,
 * and their guidelines allow scaling but forbid altering it. Rebuilding it in
 * our own components, recolouring it, or re-typesetting the label would fail
 * their OAuth app verification review. So the asset is rendered untouched and
 * only ever scaled with its aspect ratio locked.
 *
 * Light and dark variants both render; CSS picks one. That avoids a mount flag,
 * so there is no hydration flash and no cascading render.
 */
export function GoogleButton({
  next,
  className,
}: {
  /** Where to land after the round trip. Sanitised by the caller. */
  next: string;
  className?: string;
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
          // should not be silently logged in as whoever used it last.
          prompt: "select_account",
        },
      },
    });

    if (error) {
      setBusy(false);
      setError("Google sign-in is unavailable right now. Use your email instead.");
      return;
    }
    // On success the browser navigates away, so leave it busy.
  }

  return (
    <div className={className}>
      <button
        type="button"
        onClick={signIn}
        disabled={busy}
        aria-label="Sign in with Google"
        className="mx-auto block rounded-[4px] transition-opacity hover:opacity-90 disabled:opacity-60"
      >
        {/*
          Natural size 180x40, rendered at height 48 to match our own large
          buttons; width follows the 4.5:1 ratio so nothing stretches.

          `unoptimized` is deliberate: Next's image pipeline would re-encode a
          pre-approved asset, and an altered button fails Google's verification.
        */}
        <Image
          src="/google/signin-light.svg"
          alt=""
          width={216}
          height={48}
          unoptimized
          priority
          className="block dark:hidden"
        />
        <Image
          src="/google/signin-dark.svg"
          alt=""
          width={216}
          height={48}
          unoptimized
          priority
          className="hidden dark:block"
        />
      </button>

      {busy ? (
        <p className="mt-2 text-center text-sm text-ink-muted" role="status">
          Taking you to Google…
        </p>
      ) : null}

      {error ? (
        <p role="alert" className="mt-2 text-center text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}

/** "or" rule between the Google button and the email form. */
export function AuthDivider() {
  return (
    <div className="flex items-center gap-3" aria-hidden>
      <span className="h-px flex-1 bg-border" />
      <span className="text-xs uppercase tracking-wide text-ink-muted">or</span>
      <span className="h-px flex-1 bg-border" />
    </div>
  );
}
