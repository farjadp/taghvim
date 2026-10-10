// ============================================================================
// Source: src/lib/day-label.ts
// Version: 0.1.0 — 2026-10-09
// Why: The sentence a screen reader speaks for one day of the month grid. The
//      grid shows a day off by colour and an occasion by a dot; until 0.9.47 a
//      cell's accessible name was only «۱۲ مهر ۱۴۰۵», so a VoiceOver or
//      TalkBack user heard thirty numbers and could not tell which day was off.
//      Order is by use: today, weekday and date, «تعطیل», the occasions, the
//      visitor's own date, and the Gregorian date last, in Persian words so a
//      Persian voice reads it. The year is left off the Gregorian part: it is
//      spoken on every arrow press, and the month heading already says it.
// Env / Deps: lib/calendar, lib/events. Pure, no React, so the extension and
//      any later caller (a widget sentence, a share text) can use it.
// ============================================================================

import { fa, GREGORIAN_MONTHS_FA, MONTHS, toCalendar, weekdayIndex, WEEKDAYS } from './calendar';
import { eventsForDate, type CalendarEvent, type EventGroups } from './events';

// What the drawn StateMark says to a screen reader; components/state-mark uses it too,
// so the spoken and the drawn mark cannot drift apart.
export const STATE_MARK_LABEL = 'جمهوری اسلامی';

// One occasion as text: the `state` category keeps its mark here exactly as
// components/occasions draws it in front of the title.
export function occasionText(event: CalendarEvent): string {
  return event.category === 'state' ? `${STATE_MARK_LABEL}: ${event.title}` : event.title;
}

export function dayLabel(
  date: Date,
  groups: EventGroups,
  { today = false, mine, months = MONTHS }: { today?: boolean; mine?: string; months?: string[] } = {},
): string {
  const persian = toCalendar(date);
  const gregorian = toCalendar(date, 'gregorian');
  const weekday = weekdayIndex(date);
  const events = eventsForDate(date, groups);
  // The same rule that paints the cell: Friday, or any visible row flagged a holiday
  const off = weekday === 6 || events.some((event) => event.holiday);
  return [
    today && 'امروز',
    `${WEEKDAYS[weekday]} ${fa(persian.day)} ${months[persian.month - 1]} ${fa(persian.year)}`,
    off && 'تعطیل',
    ...events.map(occasionText),
    mine && `تاریخ من: ${mine}`,
    `${fa(gregorian.day)} ${GREGORIAN_MONTHS_FA[gregorian.month - 1]}`,
  ].filter(Boolean).join('، ');
}
