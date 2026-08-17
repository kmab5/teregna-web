"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useMyProvider, useProfile } from "@/lib/queries";
import { setProviderActive, upsertProfile, upsertProvider } from "@/lib/rpc";
import { useT } from "@/i18n/client";
import { errorKey } from "@/lib/errors";
import { qk } from "@/lib/query-keys";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DeleteAccount } from "@/components/teregna/delete-account";
import { LanguageSwitcher } from "@/components/teregna/language-switcher";
import { ThemeToggle } from "@/components/teregna/theme-toggle";
import { Guide } from "@/components/teregna/guide";

export function SettingsClient() {
  const t = useT();
  const qc = useQueryClient();
  const { data: provider, isPending } = useMyProvider();
  const { data: profile } = useProfile();

  const [name, setName] = useState<string | null>(null);
  const [description, setDescription] = useState<string | null>(null);
  const [location, setLocation] = useState<string | null>(null);
  const [category, setCategory] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [phone, setPhone] = useState<string | null>(null);

  const active = useMutation({
    mutationFn: (value: boolean) => setProviderActive(provider!.id, value),
    onSuccess: (_d, value) => {
      qc.invalidateQueries({ queryKey: qk.myProvider() });
      toast.success(value ? t("set.openedTitle") : t("set.closedTitle"), {
        description: value ? t("set.openedBody") : t("set.closedBody"),
      });
    },
    onError: (e) => toast.error(t(errorKey(e) as never)),
  });

  const saveProfile = useMutation({
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

  const save = useMutation({
    mutationFn: () =>
      upsertProvider({
        id: provider!.id,
        name: (name ?? provider!.name).trim(),
        description: description ?? provider!.description,
        location: location ?? provider!.location,
        category: category ?? provider!.category,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.myProvider() });
      toast.success(t("set.saved"));
    },
    onError: (e) => toast.error(t(errorKey(e) as never)),
  });

  if (isPending || !provider) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-9 w-40" />
        <Skeleton className="h-40" />
      </div>
    );
  }

  return (
    <>
      <header className="mb-6">
        <h1 className="font-display text-2xl font-semibold">{t("set.title")}</h1>
      </header>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>{t("set.openTitle")}</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between gap-6">
            <p className="text-sm text-ink-muted">
              {t("set.openBody")}
            </p>
            <Switch
              checked={provider.is_active}
              onCheckedChange={(v) => active.mutate(v)}
              aria-label={t("set.openTitle")}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("set.details")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="p-name">{t("set.bizName")}</Label>
              <Input
                id="p-name"
                value={name ?? provider.name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="p-location">{t("set.location")}</Label>
              <Input
                id="p-location"
                value={location ?? provider.location ?? ""}
                onChange={(e) => setLocation(e.target.value)}
                placeholder={t("set.locationPlaceholder")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="p-desc">{t("set.description")}</Label>
              <Textarea
                id="p-desc"
                value={description ?? provider.description ?? ""}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="p-category">{t("set.category")}</Label>
              <Input
                id="p-category"
                value={category ?? provider.category ?? ""}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="barber"
              />
            </div>
            <Button onClick={() => save.mutate()} disabled={save.isPending}>
              {save.isPending ? t("common.saving") : t("common.save")}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("set.yourDetails")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="u-name">{t("set.yourName")}</Label>
              <Input
                id="u-name"
                value={displayName ?? profile?.display_name ?? ""}
                onChange={(e) => setDisplayName(e.target.value)}
                autoComplete="name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="u-phone">{t("set.phone")}</Label>
              <Input
                id="u-phone"
                type="tel"
                inputMode="tel"
                value={phone ?? profile?.phone ?? ""}
                onChange={(e) => setPhone(e.target.value)}
                autoComplete="tel"
                className="font-mono"
              />
              <p className="text-xs text-ink-muted">
                {t("set.phoneHint")}
              </p>
            </div>
            <Button onClick={() => saveProfile.mutate()} disabled={saveProfile.isPending}>
              {saveProfile.isPending ? t("common.saving") : t("set.saveDetails")}
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
                {t("set.deleteWarnProvider")}
              </p>
              <DeleteAccount isProvider />
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
