/** Locale-aware formatting. Dates, durations and money all go through here. */

export function formatBirr(
  value: number | null | undefined,
  currency = "ETB",
  locale = "en-ET",
): string {
  if (value === null || value === undefined) return "—";
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(value);
  } catch {
    return `${currency} ${value.toFixed(0)}`;
  }
}

/** "4 min", "1 hr 12 min". Short enough to sit inside a queue row. */
export function formatDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "—";
  const s = Math.round(seconds);
  if (s < 60) return `${s} sec`;
  const mins = Math.floor(s / 60);
  if (mins < 60) return `${mins} min`;
  const hrs = Math.floor(mins / 60);
  const rem = mins % 60;
  if (hrs < 24) return rem ? `${hrs} hr ${rem} min` : `${hrs} hr`;
  const days = Math.floor(hrs / 24);
  return `${days} day${days === 1 ? "" : "s"}`;
}

/** How long this request has been waiting, from its created_at. */
export function waitingSince(createdAt: string, now: number = Date.now()): string {
  return formatDuration((now - new Date(createdAt).getTime()) / 1000);
}

export function formatDateTime(iso: string | null, locale = "en-ET"): string {
  if (!iso) return "—";
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));
}

export function formatDay(iso: string, locale = "en-ET"): string {
  return new Intl.DateTimeFormat(locale, { month: "short", day: "numeric" })
    .format(new Date(iso));
}

export function formatPercent(rate: number | null): string {
  if (rate === null) return "—";
  return `${Math.round(rate * 100)}%`;
}

/** "3 waiting" / "1 waiting" / "No queue". Reads as a fact, not a label. */
export function queueLabel(n: number): string {
  if (n === 0) return "No queue";
  return `${n} waiting`;
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}
