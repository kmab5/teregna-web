"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Logo } from "./logo";
import { AuthDivider, GoogleButton } from "./oauth-buttons";
import { getClient } from "@/lib/supabase/client";
import { safeNext } from "@/lib/routes";
import { useT } from "@/i18n/client";
import { LanguageSwitcher } from "./language-switcher";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/** Permissive on purpose: local formats vary and a strict pattern rejects real numbers. */
const PHONE_RE = /^[+0-9][0-9\s-]{6,}$/;

export function AuthForm({
  mode,
  audience,
  titleKey,
  subtitleKey,
  nextParam,
  errorParam,
}: {
  mode: "signin" | "signup";
  audience: "receiver" | "provider";
  titleKey: string;
  subtitleKey: string;
  /**
   * Read on the server and passed down rather than pulled from
   * useSearchParams(). That hook opts the whole subtree into client-side
   * rendering, which meant the entire sign-in form sat behind an empty
   * Suspense fallback and flashed blank before hydrating.
   */
  nextParam?: string;
  errorParam?: string;
}) {
  const t = useT();
  const router = useRouter();
  // Sanitised: a stale or hostile ?next must not send someone back to a login
  // page (a client-side loop) or off-site (an open redirect).
  const next = safeNext(
    nextParam ?? null,
    audience === "provider" ? "/provider" : "/browse",
  );

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // The callback route parks a reason here when a round trip fails, so the
  // person lands on an explanation rather than a silently reset form.
  const callbackError = errorParam;
  const callbackMessage =
    callbackError === "cancelled"
      ? t("auth.oauthCancelled")
      : callbackError
        ? t("auth.oauthFailed")
        : null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);

    const supabase = getClient();
    const result =
      mode === "signup"
        ? await supabase.auth.signUp({
            email,
            password,
            options: {
              data: {
                display_name: displayName.trim() || undefined,
                // Read by the provisioning trigger, so the profile has a number
                // from the moment the account exists.
                phone: phone.trim(),
              },
            },
          })
        : await supabase.auth.signInWithPassword({ email, password });

    setBusy(false);

    if (result.error) {
      // Say what to do next, not just what failed.
      setError(
        mode === "signin"
          ? t("auth.badCredentials")
          : result.error.message,
      );
      return;
    }

    router.push(next);
    router.refresh();
  }

  return (
    <main id="main" className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-4 py-12">
      <Link href="/" className="mb-8 inline-flex" aria-label={t("nav.home")}>
        <Logo />
      </Link>

      <h1 className="font-display text-2xl font-semibold">{t(titleKey as never)}</h1>
      <p className="mt-2 text-ink-muted">{t(subtitleKey as never)}</p>

      {callbackMessage ? (
        <p
          role="alert"
          className="mt-6 rounded-[var(--radius-sm)] bg-warning/10 px-3 py-2 text-sm text-warning"
        >
          {callbackMessage}
        </p>
      ) : null}

      <div className="mt-8 space-y-4">
        <GoogleButton next={next} />
        <AuthDivider label={t("auth.or")} />
      </div>

      <form onSubmit={handleSubmit} className="mt-4 space-y-4">
        {mode === "signup" ? (
          <div className="space-y-2">
            <Label htmlFor="name">{t("auth.name")}</Label>
            <Input
              id="name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              autoComplete="name"
              placeholder={t("auth.namePlaceholder")}
            />
          </div>
        ) : null}

        {/*
          Required, not optional. The product exists so two people can meet;
          without a number a provider finishes the job and has no way to say so.
        */}
        {mode === "signup" ? (
          <div className="space-y-2">
            <Label htmlFor="phone">{t("auth.phone")}</Label>
            <Input
              id="phone"
              type="tel"
              inputMode="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              autoComplete="tel"
              placeholder="+251 91 234 5678"
              className="font-mono"
            />
            <p className="text-xs text-ink-muted">{t("auth.phoneHint")}</p>
          </div>
        ) : null}

        <div className="space-y-2">
          <Label htmlFor="email">{t("auth.email")}</Label>
          <Input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">{t("auth.password")}</Label>
          <Input
            id="password"
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
          />
        </div>

        {error ? (
          <p
            role="alert"
            className="rounded-[var(--radius-sm)] bg-destructive/10 px-3 py-2 text-sm text-destructive"
          >
            {error}
          </p>
        ) : null}

        <Button
          type="submit"
          size="lg"
          className="w-full"
          disabled={busy || (mode === "signup" && !PHONE_RE.test(phone.trim()))}
        >
          {busy ? t("common.loading") : mode === "signup" ? t("auth.create") : t("auth.signIn")}
        </Button>
      </form>

      <LanguageSwitcher className="mt-8" />

      <p className="mt-6 text-sm text-ink-muted">
        {mode === "signup" ? (
          <>
            {t("auth.haveAccount")}{" "}
            <Link href="/login" className="font-medium text-primary hover:underline">
              {t("auth.signIn")}
            </Link>
          </>
        ) : (
          <>
            {t("auth.newHere")}{" "}
            <Link href="/signup" className="font-medium text-primary hover:underline">
              {t("auth.create")}
            </Link>
          </>
        )}
      </p>
    </main>
  );
}
