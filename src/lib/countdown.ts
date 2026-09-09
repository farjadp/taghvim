// ============================================================================
// Source: src/lib/countdown.ts
// Version: 0.1.0 — 2026-09-09
// Why: Days until the next occasions — the next holiday the visitor can see,
//      and the fixed anchors of the year (Nowruz, Yalda). Whole days only: the
//      instant of the equinox is not in the data, so counting seconds would
//      show a precision this calendar does not have.
// Env / Deps: lib/events through the visitor's groups; lib/calendar for civil
//      days in Tehran. No storage, no network, no Next.
// ============================================================================

import { addDays, daysBetween, fromCalendar, toCalendar } from './calendar';
import { eventsForDate, hasOfficialLunarDate, type EventGroups } from './events';

export type Occasion = {
  date: Date;
  // Whole civil days from `now` to the occasion; 0 means today.
  days: number;
  titles: string[];
  holiday: boolean;
  // A computed lunar date rather than a pinned one — may move by a day.
  uncertain: boolean;
};

// The fixed anchors of the Persian year. Yalda is the last night of Azar; the
// countdown targets the evening's date, 30 Azar.
const ANCHORS = [
  { month: 1, day: 1, title: 'نوروز' },
  { month: 9, day: 30, title: 'شب یلدا' },
] as const;

// Shown wherever a countdown appears. Preserve it: the count is to the day, not the
// instant, and a computed lunar occasion can move.
export const COUNTDOWN_NOTICE = 'شمارش به روز است، نه به لحظه؛ لحظهٔ تحویل سال در این تقویم ثبت نیست. تعطیلی قمری محاسباتی ممکن است یک روز جابه‌جا شود.';

// The next occurrence of a fixed Persian date, today included.
function nextFixed(now: Date, month: number, day: number): Date {
  const { year } = toCalendar(now);
  const candidate = fromCalendar({ year, month, day });
  return daysBetween(now, candidate) >= 0 ? candidate : fromCalendar({ year: year + 1, month, day });
}

/** Days until the next Nowruz and the next Yalda, nearest first. */
export function nextAnchors(now: Date): Occasion[] {
  return ANCHORS
    .map(({ month, day, title }) => {
      const date = nextFixed(now, month, day);
      return { date, days: daysBetween(now, date), titles: [title], holiday: month === 1, uncertain: false };
    })
    .sort((a, b) => a.days - b.days);
}

/**
 * The next `limit` official holidays the visitor can see, from tomorrow on, one entry
 * per day. A day with two holidays is one entry with both titles. Fridays are not
 * occasions: the count is to something on the calendar, not to the weekend.
 */
export function nextHolidays(now: Date, groups: EventGroups, limit = 3, horizon = 400): Occasion[] {
  const found: Occasion[] = [];
  for (let offset = 1; offset <= horizon && found.length < limit; offset += 1) {
    const date = addDays(now, offset);
    const holidays = eventsForDate(date, groups).filter((event) => event.holiday);
    if (holidays.length === 0) continue;
    found.push({
      date,
      days: offset,
      titles: holidays.map((event) => event.title),
      holiday: true,
      uncertain: holidays.some((event) => event.category === 'religious' && !hasOfficialLunarDate(date)),
    });
  }
  return found;
}
