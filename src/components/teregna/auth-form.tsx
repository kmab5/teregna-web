"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ListOrdered } from "lucide-react";
import { getClient } from "@/lib/supabase/client";
import { safeNext } from "@/lib/routes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function AuthForm({
  mode,
  audience,
  title,
  subtitle,
}: {
  mode: "signin" | "signup";
  audience: "receiver" | "provider";
  title: string;
  subtitle: string;
}) {
  const router = useRouter();
  const params = useSearchParams();
  // Sanitised: a stale or hostile ?next must not send someone back to a login
  // page (a client-side loop) or off-site (an open redirect).
  const next = safeNext(
    params.get("next"),
    audience === "provider" ? "/provider" : "/browse",
  );

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

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
            options: { data: { display_name: displayName.trim() || undefined } },
          })
        : await supabase.auth.signInWithPassword({ email, password });

    setBusy(false);

    if (result.error) {
      // Say what to do next, not just what failed.
      setError(
        mode === "signin"
          ? "That email and password do not match an account. Check them, or create an account."
          : result.error.message,
      );
      return;
    }

    router.push(next);
    router.refresh();
  }

  return (
    <main id="main" className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-4 py-12">
      <Link href="/" className="mb-8 flex items-center gap-2 font-display text-lg font-semibold">
        <ListOrdered className="size-5 text-primary" aria-hidden />
        Teregna
      </Link>

      <h1 className="font-display text-2xl font-semibold">{title}</h1>
      <p className="mt-2 text-ink-muted">{subtitle}</p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        {mode === "signup" ? (
          <div className="space-y-2">
            <Label htmlFor="name">Your name</Label>
            <Input
              id="name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              autoComplete="name"
              placeholder="Sara Girma"
            />
          </div>
        ) : null}

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
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
          <Label htmlFor="password">Password</Label>
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

        <Button type="submit" size="lg" className="w-full" disabled={busy}>
          {busy ? "One moment…" : mode === "signup" ? "Create account" : "Sign in"}
        </Button>
      </form>

      <p className="mt-6 text-sm text-ink-muted">
        {mode === "signup" ? (
          <>
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-primary hover:underline">
              Sign in
            </Link>
          </>
        ) : (
          <>
            New here?{" "}
            <Link href="/signup" className="font-medium text-primary hover:underline">
              Create an account
            </Link>
          </>
        )}
      </p>
    </main>
  );
}
