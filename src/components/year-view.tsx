// ============================================================================
// Source: src/components/year-view.tsx
// Version: 0.1.0 — 2026-09-09
// Why: The whole Persian year on one screen: twelve small month grids with
//      holidays, Fridays, bridge runs and their leave days marked, so the
//      shape of the year is visible before the list of bridges under it.
// Env / Deps: lib/calendar for the grids, lib/events for holidays through the
//      visitor's groups, and the bridges passed in from the page so both views
//      are computed once and cannot disagree. No storage, no network, no Next.
// ============================================================================

"use client";

import { dayKey, fa, MONTHS, monthGrid } from "@/lib/calendar";
import { eventsForDate, type EventGroups } from "@/lib/events";
import type { Bridge } from "@/lib/bridges";

const WEEKDAY_INITIALS = ["ش", "ی", "د", "س", "چ", "پ", "ج"];

type Mark = "leave" | "bridge" | "holiday" | "friday" | null;

// One label per state, reused by the legend and by each marked cell's title.
const MARK_LABELS: Record<Exclude<Mark, null>, string> = {
  leave: "روز مرخصی",
  bridge: "داخل یک پل",
  holiday: "تعطیل رسمی",
  friday: "جمعه",
};

const MARK_CLASSES: Record<Exclude<Mark, null>, string> = {
  leave: "border border-dashed border-clay text-clay",
  bridge: "bg-leaf text-forest",
  holiday: "bg-holiday text-clay",
  friday: "text-clay",
};

export function YearView({ year, groups, bridges, today }: {
  year: number;
  groups: EventGroups;
  bridges: Bridge[];
  today: Date;
}) {
  // Precomputed once: every day inside a bridge, and which of those are leave days.
  const leaveDays = new Set(bridges.flatMap((bridge) => bridge.leave.map(dayKey)));
  const bridgeDays = new Set<string>();
  for (const bridge of bridges) {
    for (let time = bridge.start.getTime(); time <= bridge.end.getTime(); time += 86_400_000) {
      bridgeDays.add(dayKey(new Date(time)));
    }
  }
  const todayKey = dayKey(today);

  return (
    <div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-6 px-6 pt-5 sm:grid-cols-3 lg:grid-cols-4">
        {MONTHS.map((name, index) => {
          const month = index + 1;
          const cells = monthGrid(year, month);
          return (
            <div key={month} aria-label={`${name} ${fa(year)}`} role="group">
              <p className="mb-2 text-xs font-medium">{name}</p>
              <div className="grid grid-cols-7 gap-px text-center text-[0.5625rem] leading-none text-muted" aria-hidden="true">
                {WEEKDAY_INITIALS.map((initial, i) => <span key={i} className={`pb-1 ${i === 6 ? "text-clay" : ""}`}>{initial}</span>)}
              </div>
              <div className="grid grid-cols-7 gap-px">
                {cells.map(({ date, persian, inMonth, isFriday }) => {
                  // Padding cells keep the columns aligned and say nothing.
                  if (!inMonth) return <span key={date.toISOString()} aria-hidden="true" className="aspect-square" />;
                  const key = dayKey(date);
                  const holiday = eventsForDate(date, groups).some((event) => event.holiday);
                  // Priority is the reading order: a leave day is the point of the picture,
                  // then the run it belongs to, then why the run is there at all.
                  const mark: Mark = leaveDays.has(key) ? "leave" : bridgeDays.has(key) ? "bridge" : holiday ? "holiday" : isFriday ? "friday" : null;
                  const isToday = key === todayKey;
                  const label = `${fa(persian.day)} ${name}${mark ? ` — ${MARK_LABELS[mark]}` : ""}${isToday ? " — امروز" : ""}`;
                  return (
                    <span key={key} title={label} aria-label={mark || isToday ? label : undefined}
                      className={`flex aspect-square items-center justify-center rounded-[3px] text-[0.625rem] tabular-nums ${mark ? MARK_CLASSES[mark] : "text-ink"} ${isToday ? "ring-1 ring-forest" : ""}`}>
                      {fa(persian.day)}
                    </span>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
      <ul className="mt-5 flex flex-wrap gap-x-5 gap-y-2 px-6 text-[0.625rem] text-muted" aria-label="راهنمای رنگ‌ها">
        <li className="flex items-center gap-1.5"><span className="size-3 rounded-[3px] bg-holiday border border-clay/40" />{MARK_LABELS.holiday}</li>
        <li className="flex items-center gap-1.5"><span className="size-3 rounded-[3px] bg-leaf" />{MARK_LABELS.bridge}</li>
        <li className="flex items-center gap-1.5"><span className="size-3 rounded-[3px] border border-dashed border-clay" />{MARK_LABELS.leave}</li>
        <li className="flex items-center gap-1.5"><span className="size-3 rounded-[3px] ring-1 ring-forest" />امروز</li>
      </ul>
    </div>
  );
}
