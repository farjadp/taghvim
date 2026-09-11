// ============================================================================
// Source: src/components/bridges-tool.tsx
// Version: 0.3.0 — 2026-09-09
// Why: «تعطیلات پیوسته» as a tab in the tools box: the next few runs of days
//      off, each drawn day by day with the leave days outlined, and a link to
//      the page holding the whole year.
// Env / Deps: lib/bridges over lib/events; reads the visitor's own group
//      switches, so a run can never rest on a holiday they have switched off.
//      No storage, no network, no Next imports — usable from the extension.
// ============================================================================

"use client";

import { ArrowUpLeft, Info, TriangleAlert } from "lucide-react";
import { addDays, fa, formatDate, toCalendar, WEEKDAYS, weekdayIndex } from "@/lib/calendar";
import { useMonthNames } from "./month-names-context";
import { type EventGroups } from "@/lib/events";
import { BRIDGES_NOTICE, findBridges, type Bridge } from "@/lib/bridges";
import { Occasions } from "./occasions";

// Slicing WEEKDAYS gives «سه‌» — a name cut mid zero-width joiner. Initials instead.
const WEEKDAY_INITIALS = ["ش", "ی", "د", "س", "چ", "پ", "ج"];

// A rolling year rather than the Persian year: in Esfand, «امسال» would be an empty tool
// while the longest run of the calendar sits three weeks away.
export const BRIDGES_WINDOW_DAYS = 365;

// Three fills one desktop row. The rest are one click away on /bridges, which is where the
// year view and the year switch live too.
export const BRIDGES_LIMIT = 3;

const lengthLabel = (bridge: Bridge) => `${fa(bridge.length)} روز پیوسته`;
const priceLabel = (bridge: Bridge) => bridge.leave.length === 0
  ? "بدون مرخصی"
  : `با ${fa(bridge.leave.length)} روز مرخصی`;
const dayLabel = (date: Date, months: string[]) => `${WEEKDAYS[weekdayIndex(date)]} ${fa(toCalendar(date).day)} ${months[toCalendar(date).month - 1]}`;

export function BridgeCard({ bridge }: { bridge: Bridge }) {
  const months = useMonthNames();
  const days = Array.from({ length: bridge.length }, (_, offset) => {
    const date = addDays(bridge.start, offset);
    const isLeave = bridge.leave.some((day) => day.getTime() === date.getTime());
    return { date, isLeave };
  });
  return (
    <article data-testid="bridge" className="rounded-2xl bg-paper p-4">
      <h3 className="text-sm font-medium">
        {lengthLabel(bridge)}<span className="text-muted"> · {priceLabel(bridge)}</span>
      </h3>
      <p className="mt-1 text-[0.6875rem] text-muted">{formatDate(bridge.start)} تا {formatDate(bridge.end)}</p>
      {/* One box per day of the run. A leave day is outlined rather than filled: it is a day
          the visitor has to spend, not one the calendar hands them. */}
      <ul className="mt-3 flex gap-1" aria-label="روزهای این بازه">
        {days.map(({ date, isLeave }, index) => (
          <li key={index}
            aria-label={isLeave ? `${dayLabel(date, months)} — مرخصی` : dayLabel(date, months)}
            className={`flex h-11 flex-1 flex-col items-center justify-center rounded-lg text-[0.625rem] tabular-nums ${isLeave ? "border border-dashed border-clay text-clay" : "bg-leaf text-forest"}`}>
            <span className="text-xs font-medium">{fa(toCalendar(date).day)}</span>
            <span aria-hidden="true">{WEEKDAY_INITIALS[weekdayIndex(date)]}</span>
          </li>
        ))}
      </ul>
      {bridge.leave.length > 0 && (
        <p className="mt-3 text-[0.625rem] leading-5 text-muted">مرخصی: {bridge.leave.map((date) => dayLabel(date, months)).join(" و ")}</p>
      )}
      <p className="mt-1 text-[0.625rem] leading-5 text-muted"><Occasions events={bridge.occasions} /></p>
      {bridge.uncertain && (
        <p className="mt-1 inline-flex items-center gap-1 text-[0.625rem] text-clay">
          <TriangleAlert size={11} />ممکن است یک روز جابه‌جا شود
        </p>
      )}
    </article>
  );
}

// The empty state names the switch that changes the answer instead of apologising.
export function BridgesEmpty() {
  return (
    <p className="py-8 text-center text-xs leading-6 text-muted">
      با دسته‌های روشنِ فعلی، تعطیلی پیوسته‌ای پیدا نشد. کلید «مذهبی» زیر تقویم بیشترین اثر را دارد.
    </p>
  );
}

export function BridgesNotice({ className = "" }: { className?: string }) {
  return (
    <details className={`rounded-lg bg-paper p-3 text-[0.625rem] leading-6 text-muted ${className}`}>
      <summary className="flex cursor-pointer items-center gap-1.5"><Info size={13} />دربارهٔ محاسبهٔ تعطیلات پیوسته</summary>
      <p className="pt-2">{BRIDGES_NOTICE}</p>
    </details>
  );
}

export function BridgesTool({ now, groups, moreHref }: {
  now: Date;
  groups: EventGroups;
  // Where the full list lives. A plain href, not a Next Link, so the extension could point it
  // at taghv.im the way the feedback link does.
  moreHref: string;
}) {
  const bridges = findBridges(now, addDays(now, BRIDGES_WINDOW_DAYS), groups);
  const shown = bridges.slice(0, BRIDGES_LIMIT);
  const hidden = bridges.length - shown.length;
  return (
    <div>
      {/* The description above is the panel's; this is the count, which is data. */}
      <p data-testid="bridges-count" className="mb-5 text-xs text-muted">{fa(bridges.length)} بازه در ۱۲ ماه آینده.</p>
      {shown.length === 0 ? <BridgesEmpty /> : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {shown.map((bridge, index) => <BridgeCard key={index} bridge={bridge} />)}
        </div>
      )}
      {/* The count is the reason to click, so it is in the link and not beside it. */}
      <a href={moreHref} className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-forest hover:underline">
        {hidden > 0 ? `${fa(hidden)} بازهٔ دیگر، و کل سال` : "تعطیلات پیوستهٔ کل سال"}
        <ArrowUpLeft size={13} className="opacity-60" />
      </a>
      <BridgesNotice className="mt-5" />
    </div>
  );
}
