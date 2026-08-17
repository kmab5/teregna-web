import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Clock, Phone } from "lucide-react";
import { createClient, getUser } from "@/lib/supabase/server";
import { getT } from "@/i18n/server";
import { Card, CardContent } from "@/components/ui/card";
import { RequestStatusBadge } from "@/components/teregna/request-status-badge";
import { OrderMeta } from "./order-meta";
import type { OrderDetail } from "@/lib/database.types";

export const metadata = { title: "Order" };

/**
 * One order, in full — the web counterpart of the mobile order screen.
 *
 * Server-rendered: this is a page people will bookmark, forward, and open from
 * an email, so it should not depend on client hydration to show a phone number
 * someone is standing there waiting to dial.
 *
 * Which number appears is decided by the database, not here.
 */
export default async function OrderPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = await params;
  const [user, t, supabase] = await Promise.all([getUser(), getT(), createClient()]);

  if (!user) notFound();

  const { data } = await supabase
    .from("order_detail")
    .select("*")
    .eq("id", orderId)
    .maybeSingle();

  const order = data as OrderDetail | null;
  // RLS returns nothing rather than an error for someone else's order, so a
  // missing row and a forbidden one are indistinguishable here — which is the
  // right answer to give either way.
  if (!order) notFound();

  const isProvider = order.receiver_id !== user.id;
  const phone = isProvider ? order.receiver_phone : order.provider_phone;
  const counterparty = isProvider ? order.receiver_name : order.provider_name;

  return (
    <main id="main" className="mx-auto max-w-2xl px-4 py-6 md:py-10">
      <Link
        href={isProvider ? "/provider" : "/requests"}
        className="inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink"
      >
        <ArrowLeft className="size-4" aria-hidden />
        {t("common.back")}
      </Link>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-semibold">{counterparty}</h1>
        <RequestStatusBadge status={order.status} />
      </div>

      <OrderMeta order={order} isProvider={isProvider} />

      <div className="mt-6 space-y-4">
        <Card>
          <CardContent className="space-y-3 pt-6">
            <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">
              {isProvider ? t("order.customer") : t("order.provider")}
            </p>
            <p className="font-display text-lg font-semibold">{counterparty}</p>

            {phone ? (
              <a
                href={`tel:${phone}`}
                className="inline-flex items-center gap-2 rounded-[var(--radius-sm)] border border-border px-3 py-2.5 font-mono text-sm text-primary hover:bg-muted"
              >
                <Phone className="size-4" aria-hidden />
                {phone}
              </a>
            ) : (
              <p className="text-sm text-ink-muted">
                {isProvider ? t("order.noPhone") : t("order.phoneAfterStart")}
              </p>
            )}
          </CardContent>
        </Card>

        {order.items.length > 0 ? (
          <Card>
            <CardContent className="space-y-2.5 pt-6">
              <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">
                {t("order.items")}
              </p>
              {order.items.map((it, i) => (
                <div
                  key={`${it.item_id ?? it.name}-${i}`}
                  className="flex items-center justify-between gap-3"
                >
                  <span>
                    {it.quantity > 1 ? `${it.quantity}× ` : ""}
                    {it.name}
                  </span>
                  <span className="font-mono tnum text-sm">
                    {new Intl.NumberFormat("en-ET", {
                      style: "currency",
                      currency: "ETB",
                      maximumFractionDigits: 0,
                    }).format(it.price ?? 0)}
                  </span>
                </div>
              ))}
              <div className="flex items-center justify-between border-t border-border pt-2.5">
                <span className="font-medium">{t("order.total")}</span>
                <span className="font-mono tnum text-base font-semibold">
                  {new Intl.NumberFormat("en-ET", {
                    style: "currency",
                    currency: "ETB",
                    maximumFractionDigits: 0,
                  }).format(order.total_price)}
                </span>
              </div>
            </CardContent>
          </Card>
        ) : null}

        {order.note ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-ink-muted">{order.note}</p>
            </CardContent>
          </Card>
        ) : null}

        {order.expected_minutes > 0 ? (
          <Card>
            <CardContent className="flex items-center justify-between pt-6">
              <span className="inline-flex items-center gap-1.5 text-sm text-ink-muted">
                <Clock className="size-4" aria-hidden />
                {t("order.expected")}
              </span>
              <span className="font-mono tnum text-sm">
                {t("order.minutes", { count: order.expected_minutes })}
              </span>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </main>
  );
}
