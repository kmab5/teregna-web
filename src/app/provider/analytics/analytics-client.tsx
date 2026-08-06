"use client";

import { useState } from "react";
import { useMyProvider, useAnalytics } from "@/lib/queries";
import { StatCard } from "@/components/teregna/stat-card";
import { ChartCard } from "@/components/teregna/chart-card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDay, formatDuration, formatPercent } from "@/lib/format";
import { cn } from "@/lib/utils";

const RANGES = [
  { days: 7, label: "7 days" },
  { days: 30, label: "30 days" },
  { days: 90, label: "90 days" },
];

export function AnalyticsClient() {
  const [days, setDays] = useState(30);
  const { data: provider } = useMyProvider();
  const { data, isPending } = useAnalytics(provider?.id, days);

  return (
    <>
      <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold">Analytics</h1>
          <p className="mt-1 text-ink-muted">How the queue has been moving.</p>
        </div>
        <div className="flex gap-2">
          {RANGES.map((r) => (
            <button
              key={r.days}
              type="button"
              onClick={() => setDays(r.days)}
              aria-pressed={days === r.days}
              className={cn(
                "rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
                days === r.days
                  ? "bg-primary text-on-primary"
                  : "bg-muted text-ink-muted hover:text-ink",
              )}
            >
              {r.label}
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
            <StatCard label="Requests" value={String(data.totals.total)} hint="Created in this period" />
            <StatCard label="Completed" value={String(data.totals.completed)} />
            <StatCard label="Cancelled" value={String(data.totals.cancelled)} />
            <StatCard
              label="Completion rate"
              value={formatPercent(data.completion_rate)}
              hint="Completed vs. completed + cancelled"
            />
            <StatCard
              label="Typical wait to finish"
              value={formatDuration(data.median_time_to_complete_seconds)}
              hint={`Average ${formatDuration(data.avg_time_to_complete_seconds)}`}
            />
            <StatCard
              label="Waiting right now"
              value={String(data.current_queue_length)}
              hint="Live, not part of the range"
            />
          </div>

          <ChartCard
            title="Requests over time"
            description="Every day in the range, including the quiet ones."
            kind="area"
            data={data.over_time.map((p) => ({
              label: formatDay(p.day),
              value: p.count,
            }))}
          />

          <div className="grid gap-6 lg:grid-cols-2">
            <ChartCard
              title="Most requested"
              description="By number of requests that included the item."
              horizontal
              data={data.by_item.slice(0, 8).map((p) => ({
                label: p.item,
                value: p.count,
              }))}
            />
            <ChartCard
              title="Busiest hours"
              description="Local time, all 24 hours shown."
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
