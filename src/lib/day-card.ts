// ============================================================================
// Source: src/lib/day-card.ts
// Version: 0.1.0 — 2026-09-09
// Why: What goes on a shareable card for one day, as data. The drawing lives in
//      the component; everything decidable without a canvas is decided here so
//      it can be tested without one.
// Env / Deps: lib/calendar and lib/events through the visitor's groups. No
//      storage, no network, no DOM — safe to import anywhere.
// ============================================================================

import { dateNumbers, fa, formatDate, MONTHS, toCalendar, WEEKDAYS, weekdayIndex } from './calendar';
import { eventsForDate, type CalendarEvent, type EventGroups } from './events';

export type DayCard = {
  // «چهارشنبه»
  weekday: string;
  // «۱۸» and «شهریور» kept apart: the card sets them at different sizes.
  day: string;
  month: string;
  year: string;
  // «2026-09-09» — Latin digits, LTR, as everywhere else in the app.
  gregorian: string;
  // «۲۶ ربیع‌الاول ۱۴۴۸»
  islamic: string;
  // The day's occasions, already filtered by the visitor's own switches.
  occasions: CalendarEvent[];
  // True when any of them is an official holiday.
  holiday: boolean;
};

// The domain goes on the card because a card outlives the page it came from.
export const CARD_SOURCE = 'taghv.im';

// How many occasions a card can hold before it stops being a card. Beyond this the
// remainder is counted rather than listed.
export const MAX_OCCASIONS = 3;

export function dayCard(date: Date, groups: EventGroups): DayCard {
  const persian = toCalendar(date);
  const occasions = eventsForDate(date, groups);
  return {
    weekday: WEEKDAYS[weekdayIndex(date)],
    day: fa(persian.day),
    month: MONTHS[persian.month - 1],
    year: fa(persian.year),
    gregorian: dateNumbers(date, 'gregorian'),
    islamic: formatDate(date, 'islamic'),
    occasions,
    holiday: occasions.some((event) => event.holiday),
  };
}

/** The occasion lines a card shows, and how many it had to leave out. */
export function cardOccasions(card: DayCard, limit = MAX_OCCASIONS): { lines: string[]; hidden: number } {
  return {
    lines: card.occasions.slice(0, limit).map((event) => event.title),
    hidden: Math.max(0, card.occasions.length - limit),
  };
}

/**
 * A filename that sorts by date and says what it is. Latin digits and ASCII only: Persian
 * digits in a filename survive the browser but not every place the file is then sent.
 */
export function cardFilename(date: Date): string {
  const { year, month, day } = toCalendar(date);
  const pad = (value: number) => String(value).padStart(2, '0');
  return `taghvim-${year}-${pad(month)}-${pad(day)}.png`;
}
