"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useMyProvider, useProfile } from "@/lib/queries";
import { upsertProfile } from "@/lib/rpc";
import { useT } from "@/i18n/client";
import { errorKey } from "@/lib/errors";
import { qk } from "@/lib/query-keys";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { DeleteAccount } from "@/components/teregna/delete-account";
import { LanguageSwitcher } from "@/components/teregna/language-switcher";
import { ThemeToggle } from "@/components/teregna/theme-toggle";
import { Guide } from "@/components/teregna/guide";

export function AccountClient({ email }: { email: string }) {
  const t = useT();
  const qc = useQueryClient();
  const { data: profile, isPending } = useProfile();
  const { data: provider } = useMyProvider();

  const [displayName, setDisplayName] = useState<string | null>(null);
  const [phone, setPhone] = useState<string | null>(null);

  const save = useMutation({
    mutationFn: () =>
      upsertProfile({
        display_name: (displayName ?? profile?.display_name ?? "").trim(),
        phone: (phone ?? profile?.phone ?? "").trim(),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.profile() });
      toast.success(t("set.saved"));
    },
    onError: (e) => toast.error(t(errorKey(e) as never)),
  });

  if (isPending) return <Skeleton className="mt-6 h-64" />;

  return (
    <div className="mt-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{t("set.yourDetails")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">{t("set.yourName")}</Label>
            <Input
              id="name"
              value={displayName ?? profile?.display_name ?? ""}
              onChange={(e) => setDisplayName(e.target.value)}
              autoComplete="name"
            />
            <p className="text-xs text-ink-muted">
              {t("acct.nameHint")}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">{t("set.phone")}</Label>
            <Input
              id="phone"
              type="tel"
              inputMode="tel"
              value={phone ?? profile?.phone ?? ""}
              onChange={(e) => setPhone(e.target.value)}
              autoComplete="tel"
              className="font-mono"
            />
            <p className="text-xs text-ink-muted">{t("set.phoneHint")}</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">{t("auth.email")}</Label>
            <Input id="email" value={email} readOnly disabled />
          </div>

          <Button onClick={() => save.mutate()} disabled={save.isPending}>
            {save.isPending ? t("common.saving") : t("common.save")}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("theme.title")}</CardTitle>
        </CardHeader>
        <CardContent>
          <ThemeToggle />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("guide.title")}</CardTitle>
        </CardHeader>
        <CardContent>
          <Guide />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("common.language")}</CardTitle>
        </CardHeader>
        <CardContent>
          <LanguageSwitcher />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("set.account")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form action="/auth/signout" method="post">
            <Button type="submit" variant="outline">{t("set.signOut")}</Button>
          </form>

          <div className="border-t border-border pt-4">
            <p className="mb-3 text-sm text-ink-muted">
              {provider ? t("set.deleteWarnProvider") : t("acct.deleteWarn")}
            </p>
            <DeleteAccount isProvider={Boolean(provider)} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
