"use client";

import { useState } from "react";
import { Table2, ChartLine } from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { cn } from "@/lib/utils";

type Point = { label: string; value: number };

/**
 * A chart that can always be read as a table.
 *
 * Charts are not the only way to get at this data: colour-blind users, screen
 * readers and anyone who just wants the number get the same content in a table
 * one tap away. The toggle is a first-class control, not an accessibility
 * afterthought.
 */
export function ChartCard({
  title,
  description,
  data,
  kind = "bar",
  valueLabel = "Requests",
  horizontal = false,
}: {
  title: string;
  description?: string;
  data: Point[];
  kind?: "area" | "bar";
  valueLabel?: string;
  horizontal?: boolean;
}) {
  const [asTable, setAsTable] = useState(false);
  const empty = data.every((d) => d.value === 0);

  return (
    <section className="rounded-[var(--radius-md)] border border-border bg-surface p-5 elev-1">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h3 className="font-display text-lg font-semibold">{title}</h3>
          {description ? (
            <p className="text-sm text-ink-muted">{description}</p>
          ) : null}
        </div>
        <button
          type="button"
          onClick={() => setAsTable((v) => !v)}
          aria-pressed={asTable}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-[var(--radius-sm)] border border-border px-2.5 py-1.5 text-xs font-medium text-ink-muted transition-colors hover:bg-muted hover:text-ink"
        >
          {asTable ? (
            <>
              <ChartLine className="size-3.5" aria-hidden /> Chart
            </>
          ) : (
            <>
              <Table2 className="size-3.5" aria-hidden /> Table
            </>
          )}
        </button>
      </div>

      {empty ? (
        <p className="py-10 text-center text-sm text-ink-muted">
          Nothing recorded in this period yet.
        </p>
      ) : asTable ? (
        <div className="max-h-72 overflow-y-auto">
          <table className="w-full text-sm">
            <caption className="sr-only">{title}</caption>
            <thead className="sticky top-0 bg-surface">
              <tr className="border-b border-border text-left">
                <th scope="col" className="py-2 font-medium">
                  {horizontal ? "Item" : "When"}
                </th>
                <th scope="col" className="py-2 text-right font-medium">
                  {valueLabel}
                </th>
              </tr>
            </thead>
            <tbody>
              {data.map((d) => (
                <tr key={d.label} className="border-b border-border/60">
                  <td className="py-2">{d.label}</td>
                  <td className="py-2 text-right font-mono tnum">{d.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className={cn("w-full", horizontal ? "h-72" : "h-56")}>
          <ResponsiveContainer width="100%" height="100%">
            {kind === "area" ? (
              <AreaChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid stroke="var(--border)" vertical={false} />
                <XAxis
                  dataKey="label"
                  stroke="var(--ink-muted)"
                  fontSize={12}
                  tickLine={false}
                />
                <YAxis
                  stroke="var(--ink-muted)"
                  fontSize={12}
                  tickLine={false}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{
                    background: "var(--surface)",
                    border: "1px solid var(--border)",
                    borderRadius: "var(--radius-sm)",
                    color: "var(--ink)",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  name={valueLabel}
                  stroke="var(--primary)"
                  fill="var(--primary)"
                  fillOpacity={0.14}
                  strokeWidth={2}
                />
              </AreaChart>
            ) : (
              <BarChart
                data={data}
                layout={horizontal ? "vertical" : "horizontal"}
                margin={{ top: 4, right: 8, left: horizontal ? 24 : -20, bottom: 0 }}
              >
                <CartesianGrid stroke="var(--border)" vertical={horizontal} horizontal={!horizontal} />
                {horizontal ? (
                  <>
                    <XAxis type="number" stroke="var(--ink-muted)" fontSize={12} allowDecimals={false} />
                    <YAxis
                      type="category"
                      dataKey="label"
                      stroke="var(--ink-muted)"
                      fontSize={12}
                      width={110}
                      tickLine={false}
                    />
                  </>
                ) : (
                  <>
                    <XAxis dataKey="label" stroke="var(--ink-muted)" fontSize={12} tickLine={false} />
                    <YAxis stroke="var(--ink-muted)" fontSize={12} tickLine={false} allowDecimals={false} />
                  </>
                )}
                <Tooltip
                  cursor={{ fill: "var(--muted)" }}
                  contentStyle={{
                    background: "var(--surface)",
                    border: "1px solid var(--border)",
                    borderRadius: "var(--radius-sm)",
                    color: "var(--ink)",
                  }}
                />
                <Bar dataKey="value" name={valueLabel} fill="var(--primary)" radius={[4, 4, 0, 0]} />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
}
