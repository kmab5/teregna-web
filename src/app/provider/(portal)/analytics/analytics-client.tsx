"use client";

import { useState } from "react";
import { useMyProvider, useAnalytics } from "@/lib/queries";
import { StatCard } from "@/components/teregna/stat-card";
import { ChartCard } from "@/components/teregna/chart-card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDuration } from "@/lib/format";
import { useT } from "@/i18n/client";
import { useLocaleFormat } from "@/lib/use-locale-format";
import { cn } from "@/lib/utils";

export function AnalyticsClient() {
  const t = useT();
  const { day, percent } = useLocaleFormat();
  const [days, setDays] = useState(30);
  const RANGES = [7, 30, 90];
  const { data: provider } = useMyProvider();
  const { data, isPending } = useAnalytics(provider?.id, days);

  return (
    <>
      <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold">{t("an.title")}</h1>
          <p className="mt-1 text-ink-muted">{t("an.subtitle")}</p>
        </div>
        <div className="flex gap-2">
          {RANGES.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setDays(r)}
              aria-pressed={days === r}
              className={cn(
                "rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
                days === r
                  ? "bg-primary text-on-primary"
                  : "bg-muted text-ink-muted hover:text-ink",
              )}
            >
              {t("an.days", { count: r })}
            </button>
          ))}
        </div>
      </header>

      {isPending || !data ? (
        <div className="space-y-6">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-24" />)}
          </div>
          <Skeleton className="h-72" />
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <StatCard label={t("an.requests")} value={String(data.totals.total)} hint={t("an.requestsHint")} />
            <StatCard label={t("an.completed")} value={String(data.totals.completed)} />
            <StatCard label={t("an.cancelled")} value={String(data.totals.cancelled)} />
            <StatCard
              label={t("an.rate")}
              value={percent(data.completion_rate)}
              hint={t("an.rateHint")}
            />
            <StatCard
              label={t("an.typical")}
              value={formatDuration(data.median_time_to_complete_seconds)}
              hint={t("an.typicalHint", { value: formatDuration(data.avg_time_to_complete_seconds) })}
            />
            <StatCard
              label={t("an.now")}
              value={String(data.current_queue_length)}
              hint={t("an.nowHint")}
            />
          </div>

          <ChartCard
            title={t("an.overTime")}
            description={t("an.overTimeHint")}
            kind="area"
            data={data.over_time.map((p) => ({
              label: day(p.day),
              value: p.count,
            }))}
          />

          <div className="grid gap-6 lg:grid-cols-2">
            <ChartCard
              title={t("an.byItem")}
              description={t("an.byItemHint")}
              horizontal
              data={data.by_item.slice(0, 8).map((p) => ({
                label: p.item,
                value: p.count,
              }))}
            />
            <ChartCard
              title={t("an.hours")}
              description={t("an.hoursHint")}
              data={data.busiest_hours.map((p) => ({
                label: `${String(p.hour).padStart(2, "0")}:00`,
                value: p.count,
              }))}
            />
          </div>
        </div>
      )}
    </>
  );
}
