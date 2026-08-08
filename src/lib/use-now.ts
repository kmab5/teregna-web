"use client";

import { useEffect, useState } from "react";

/**
 * A clock that ticks, so elapsed times do not silently freeze.
 *
 * Without this, "waiting 4 min" is rendered once and then stays at 4 minutes
 * for as long as the tab is open - which reads as a broken feed even when the
 * data is perfectly fresh.
 */
export function useNow(intervalMs = 20_000): number {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const tick = () => setNow(Date.now());
    const id = setInterval(tick, intervalMs);
    // Coming back to the tab should not show a stale number for a whole tick.
    document.addEventListener("visibilitychange", tick);
    window.addEventListener("focus", tick);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", tick);
      window.removeEventListener("focus", tick);
    };
  }, [intervalMs]);

  return now;
}
