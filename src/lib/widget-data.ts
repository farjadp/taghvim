// ============================================================================
// Source: src/lib/widget-data.ts
// Version: 0.1.0 — 2026-09-10
// Why: The occasions a native widget shows, as data. A widget runs no JavaScript,
//      so the Android and iPhone widgets cannot call eventsForDate. Instead of
//      re-implementing the event tables twice in Kotlin and Swift — two copies
//      that drift — this writes what eventsForDate says for every day of a fixed
//      window, and the widget only looks a day up. Each row keeps its category,
//      so the widget filters by the visitor's groups exactly as the web does:
//      `iran` always, the other three by their switch, and a day is a holiday
//      only when a VISIBLE row says so. A unit test proves that filter equals
//      eventsForDate for every combination of groups on every day.
// Env / Deps: lib/calendar, lib/events, lib/month-names. Pure; no I/O. The file
//      itself is written by scripts/build-widget-data.mjs and committed.
// ============================================================================

import { addDays, fromCalendar, MONTHS, toCalendar, WEEKDAYS } from './calendar';
import { ALL_GROUPS, EVENTS_NOTICE, eventsForDate, hasOfficialLunarDate, type EventCategory, type EventGroups } from './events';
import { monthNames } from './month-names';

// Bump when the shape changes, so a widget can refuse a file it cannot read
// instead of showing a wrong day.
export const WIDGET_DATA_VERSION = 1;

// A fixed window, never «this year»: the file is committed, and a window read off
// the clock would make the same commit produce a different file after Nowruz.
// Moving it is a deliberate edit, and widget-data.test.ts fails once the window
// no longer reaches the year after the current one.
export const WIDGET_YEARS = { from: 1405, to: 1407 } as const;

// [title, category, holiday, uncertain]. `uncertain` marks a lunar holiday that
// was computed by islamic-civil rather than pinned to the official calendar —
// the one kind of row that may land a day off.
export type WidgetEvent = [string, EventCategory, 0 | 1, 0 | 1];

export type WidgetData = {
  version: number;
  years: { from: number; to: number };
  months: string[];
  monthsOlder: string[];
  weekdays: string[];
  notice: string;
  // Keyed «year-month-day» in the Persian calendar; days with no occasion are absent.
  days: Record<string, WidgetEvent[]>;
};

// The filter both native widgets must reproduce, kept here as the reference the
// test holds eventsForDate against. National rows always show; the rest follow
// their switch.
export function visibleWidgetEvents(rows: readonly WidgetEvent[], groups: EventGroups): WidgetEvent[] {
  return rows.filter(([, category]) => category === 'iran' || groups[category]);
}

// What the native Jalali ports are tested against: the web's own answers, so the
// widget and the site cannot disagree about which day it is. Every consecutive
// day of a span that covers the widget window with room either side, plus 1
// Farvardin of every supported year, which pins every leap-year decision.
export const VECTOR_YEARS = { from: 1395, to: 1420 } as const;

export type JalaliVectors = {
  // Gregorian «YYYY-MM-DD» of the first entry in `days`; each next entry is the next day.
  start: string;
  days: [number, number, number][];
  // Persian year → Gregorian «YYYY-MM-DD» of its 1 Farvardin, for 1200–1600.
  nowruz: Record<string, string>;
};

const iso = (date: Date) => date.toISOString().slice(0, 10);

export function buildJalaliVectors(): JalaliVectors {
  const first = fromCalendar({ year: VECTOR_YEARS.from, month: 1, day: 1 });
  const end = fromCalendar({ year: VECTOR_YEARS.to + 1, month: 1, day: 1 });
  const days: [number, number, number][] = [];
  for (let date = first; date < end; date = addDays(date, 1)) {
    const { year, month, day } = toCalendar(date);
    days.push([year, month, day]);
  }
  const nowruz: Record<string, string> = {};
  for (let year = 1200; year <= 1600; year += 1) nowruz[year] = iso(fromCalendar({ year, month: 1, day: 1 }));
  return { start: iso(first), days, nowruz };
}

export function buildWidgetData(from: number = WIDGET_YEARS.from, to: number = WIDGET_YEARS.to): WidgetData {
  if (!Number.isSafeInteger(from) || !Number.isSafeInteger(to) || from > to) {
    throw new RangeError('Widget years must be an ascending pair of integers.');
  }
  const days: Record<string, WidgetEvent[]> = {};
  const last = fromCalendar({ year: to + 1, month: 1, day: 1 });
  for (let date = fromCalendar({ year: from, month: 1, day: 1 }); date < last; date = addDays(date, 1)) {
    const events = eventsForDate(date, ALL_GROUPS);
    if (events.length === 0) continue;
    const { year, month, day } = toCalendar(date);
    const pinned = hasOfficialLunarDate(date);
    days[`${year}-${month}-${day}`] = events.map((event): WidgetEvent => [
      event.title,
      event.category,
      event.holiday ? 1 : 0,
      event.category === 'religious' && !pinned ? 1 : 0,
    ]);
  }
  return {
    version: WIDGET_DATA_VERSION,
    years: { from, to },
    months: [...MONTHS],
    monthsOlder: monthNames(true),
    weekdays: [...WEEKDAYS],
    notice: EVENTS_NOTICE,
    days,
  };
}
