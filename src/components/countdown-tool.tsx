// ============================================================================
// Source: src/components/countdown-tool.tsx
// Version: 0.1.0 — 2026-09-09
// Why: «روزشمار» as a tab in the tools box: whole days to the next occasions
//      the visitor can see, plus Nowruz and Yalda, nearest first.
// Env / Deps: lib/countdown over lib/events through the visitor's groups.
//      Days, never seconds — the instant of the equinox is not in the data.
//      No storage, no network, no Next imports.
// ============================================================================

"use client";

import { Info, TriangleAlert } from "lucide-react";
import { dayKey, fa, formatDate } from "@/lib/calendar";
import { type EventGroups } from "@/lib/events";
import { COUNTDOWN_NOTICE, nextAnchors, nextHolidays, type Occasion } from "@/lib/countdown";

// How many of the next holidays to list beside the two anchors.
const HOLIDAY_COUNT = 3;

export function CountdownTool({ now, groups }: { now: Date; groups: EventGroups }) {
  // Anchors and holidays can be the same day — Nowruz is both — so they are merged on the
  // day, keeping whichever entry carries the richer titles.
  const merged = new Map<string, Occasion>();
  for (const item of [...nextHolidays(now, groups, HOLIDAY_COUNT), ...nextAnchors(now)]) {
    const key = dayKey(item.date);
    const existing = merged.get(key);
    if (!existing) merged.set(key, item);
    else merged.set(key, { ...existing, titles: [...new Set([...existing.titles, ...item.titles])] });
  }
  const items = [...merged.values()].sort((a, b) => a.days - b.days);

  return (
    <div>
      <p className="mb-5 text-sm font-medium">چند روز تا مناسبت‌های بعدی، و تا نوروز و یلدا.</p>
      <ul className="flex flex-col">
        {items.map((item) => (
          <li key={dayKey(item.date)} className="flex items-baseline gap-4 border-b border-line py-3.5 last:border-0">
            <span className="min-w-16 text-xl leading-6 font-medium tabular-nums text-forest">
              {item.days === 0 ? "امروز" : fa(item.days)}
              {item.days > 0 && <span className="mr-1.5 text-[0.625rem] font-normal text-muted">روز</span>}
            </span>
            <span className="flex-1 text-xs leading-6">
              <span className={item.holiday ? "font-medium text-clay" : "font-medium"}>{item.titles.join(" · ")}</span>
              {item.holiday && <span className="mr-2 text-[0.625rem] text-clay">تعطیل</span>}
              <span className="block text-[0.625rem] text-muted">{formatDate(item.date, "persian", true)}</span>
              {item.uncertain && (
                <span className="mt-0.5 inline-flex items-center gap-1 text-[0.625rem] text-clay">
                  <TriangleAlert size={11} />ممکن است یک روز جابه‌جا شود
                </span>
              )}
            </span>
          </li>
        ))}
      </ul>
      <details className="mt-5 rounded-lg bg-paper p-3 text-[0.625rem] leading-6 text-muted">
        <summary className="flex cursor-pointer items-center gap-1.5"><Info size={13} />دربارهٔ این شمارش</summary>
        <p className="pt-2">{COUNTDOWN_NOTICE}</p>
      </details>
    </div>
  );
}
