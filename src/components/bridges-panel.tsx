// ============================================================================
// Source: src/components/bridges-panel.tsx
// Version: 0.1.0 — 2026-09-09
// Why: Holiday bridges as a full-width row: each run drawn day by day, with the
//      leave days marked where they actually fall.
// Env / Deps: lib/bridges over lib/events; reads the visitor's own group
//      switches, so a run can never rest on a holiday they have switched off.
//      No storage, no network. `layout` is a SANDBOX prop — see the note below.
// ============================================================================

"use client";

import { CalendarRange, Info, TriangleAlert } from "lucide-react";
import { addDays, fa, formatDate, MONTHS, toCalendar, WEEKDAYS, weekdayIndex } from "@/lib/calendar";
import { type EventGroups } from "@/lib/events";
import { BRIDGES_NOTICE, findBridges, type Bridge } from "@/lib/bridges";

// Slicing WEEKDAYS gives «سه‌» — a name cut mid zero-width joiner. Initials instead.
const WEEKDAY_INITIALS = ["ش", "ی", "د", "س", "چ", "پ", "ج"];

// A rolling year rather than the Persian year: in Esfand, «امسال» would be an empty panel
// while the longest run of the calendar sits three weeks away.
const WINDOW_DAYS = 365;

const lengthLabel = (bridge: Bridge) => `${fa(bridge.length)} روز پیوسته`;
const priceLabel = (bridge: Bridge) => bridge.leave.length === 0
  ? "بدون مرخصی"
  : `با ${fa(bridge.leave.length)} روز مرخصی`;
const dayLabel = (date: Date) => `${WEEKDAYS[weekdayIndex(date)]} ${fa(toCalendar(date).day)} ${MONTHS[toCalendar(date).month - 1]}`;

function BridgeCard({ bridge }: { bridge: Bridge }) {
  const days = Array.from({ length: bridge.length }, (_, offset) => {
    const date = addDays(bridge.start, offset);
    const isLeave = bridge.leave.some((day) => day.getTime() === date.getTime());
    return { date, isLeave };
  });
  return (
    <div className="rounded-2xl bg-paper p-4">
      <p className="text-sm font-medium">
        {lengthLabel(bridge)}<span className="text-muted"> · {priceLabel(bridge)}</span>
      </p>
      <p className="mt-1 text-[0.6875rem] text-muted">{formatDate(bridge.start)} تا {formatDate(bridge.end)}</p>
      {/* One box per day of the run. A leave day is outlined rather than filled: it is a day
          the visitor has to spend, not one the calendar hands them. */}
      <div className="mt-3 flex gap-1">
        {days.map(({ date, isLeave }, index) => (
          <span key={index}
            title={isLeave ? `${dayLabel(date)} — مرخصی` : dayLabel(date)}
            className={`flex h-11 flex-1 flex-col items-center justify-center rounded-lg text-[0.625rem] tabular-nums ${isLeave ? "border border-dashed border-clay text-clay" : "bg-leaf text-forest"}`}>
            <span className="text-xs font-medium">{fa(toCalendar(date).day)}</span>
            <span>{WEEKDAY_INITIALS[weekdayIndex(date)]}</span>
          </span>
        ))}
      </div>
      {bridge.leave.length > 0 && (
        <p className="mt-3 text-[0.625rem] leading-5 text-muted">مرخصی: {bridge.leave.map(dayLabel).join(" و ")}</p>
      )}
      <p className="mt-1 text-[0.625rem] leading-5 text-muted">{bridge.titles.join(" · ")}</p>
      {bridge.uncertain && (
        <p className="mt-1 inline-flex items-center gap-1 text-[0.625rem] text-clay">
          <TriangleAlert size={11} />ممکن است یک روز جابه‌جا شود
        </p>
      )}
    </div>
  );
}

export function BridgesPanel({ now, groups, layout = "grid", className }: {
  now: Date;
  groups: EventGroups;
  // SANDBOX ONLY, and the only reason this prop exists: `grid` lays the runs out in columns,
  // `rows` gives each one the full width. Delete the prop and keep whichever Farjad picks.
  layout?: "grid" | "rows";
  className?: string;
}) {
  const bridges = findBridges(now, addDays(now, WINDOW_DAYS), groups);
  return (
    <section aria-labelledby="bridges-title" className={`rounded-[1.75rem] border border-line bg-surface ${className ?? ""}`}>
      <div className="flex items-center justify-between border-b border-line px-6 py-4">
        <h2 id="bridges-title" className="text-lg font-semibold">پل‌های تعطیلات</h2>
        <div className="flex items-center gap-3">
          <span className="rounded-md bg-paper px-2 py-1 text-[0.625rem] text-muted">{fa(bridges.length)} پل در ۱۲ ماه آینده</span>
          <CalendarRange size={18} className="text-forest" />
        </div>
      </div>
      {bridges.length === 0 ? (
        // Never a slogan in an empty state: say which switch changes the answer.
        <p className="px-6 py-8 text-center text-xs leading-6 text-muted">
          با دسته‌های روشنِ فعلی، تعطیلی پیوسته‌ای در ۱۲ ماه آینده پیدا نشد. کلید «مذهبی» زیر تقویم بیشترین اثر را دارد.
        </p>
      ) : (
        <div className={`gap-4 px-6 py-5 ${layout === "grid" ? "grid sm:grid-cols-2 lg:grid-cols-3" : "flex flex-col"}`}>
          {bridges.map((bridge, index) => <BridgeCard key={index} bridge={bridge} />)}
        </div>
      )}
      <details className="mx-6 mb-5 rounded-lg bg-paper p-3 text-[0.625rem] leading-6 text-muted">
        <summary className="flex cursor-pointer items-center gap-1.5"><Info size={13} />دربارهٔ محاسبهٔ پل‌ها</summary>
        <p className="pt-2">{BRIDGES_NOTICE}</p>
      </details>
    </section>
  );
}
