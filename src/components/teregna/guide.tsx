"use client";

import { useState } from "react";
import {
  Archive,
  Compass,
  ListOrdered,
  Package,
  PackageX,
  Play,
  Send,
  Store,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useT } from "@/i18n/client";

const CUSTOMER = [
  { icon: Compass, titleKey: "guide.c1.title", bodyKey: "guide.c1.body" },
  { icon: Send, titleKey: "guide.c2.title", bodyKey: "guide.c2.body" },
  { icon: ListOrdered, titleKey: "guide.c3.title", bodyKey: "guide.c3.body" },
] as const;

const PROVIDER = [
  { icon: Package, titleKey: "guide.p1.title", bodyKey: "guide.p1.body" },
  { icon: Play, titleKey: "guide.p2.title", bodyKey: "guide.p2.body" },
  { icon: Archive, titleKey: "guide.p3.title", bodyKey: "guide.p3.body" },
  { icon: Store, titleKey: "guide.p4.title", bodyKey: "guide.p4.body" },
] as const;

/**
 * The guide.
 *
 * Covers both sides, because everyone has one account and a customer can become
 * a provider without signing up again — someone reading this may not yet know
 * the second half applies to them.
 */
export function Guide() {
  const t = useT();
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        {t("guide.open")}
      </Button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent title={t("guide.title")}>
          <div className="space-y-5">
            <Section label={t("guide.customer")} />
            {CUSTOMER.map(({ icon: Icon, titleKey, bodyKey }) => (
              <Row
                key={titleKey}
                icon={<Icon className="size-4 text-primary" aria-hidden />}
                title={t(titleKey)}
                body={t(bodyKey)}
              />
            ))}

            <Section label={t("guide.provider")} />
            {PROVIDER.map(({ icon: Icon, titleKey, bodyKey }) => (
              <Row
                key={titleKey}
                icon={<Icon className="size-4 text-primary" aria-hidden />}
                title={t(titleKey)}
                body={t(bodyKey)}
              />
            ))}

            <Section label={t("guide.stock")} />
            <Row
              icon={<PackageX className="size-4 text-warning" aria-hidden />}
              title={t("guide.stock")}
              body={t("guide.stockBody")}
            />
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}

function Section({ label }: { label: string }) {
  return (
    <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">
      {label}
    </p>
  );
}

function Row({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="flex gap-3">
      <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-muted">
        {icon}
      </span>
      <div>
        <p className="font-medium">{title}</p>
        <p className="text-sm text-ink-muted">{body}</p>
      </div>
    </div>
  );
}
