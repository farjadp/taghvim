// ============================================================================
// Source: src/lib/day-label.ts
// Version: 0.2.0 — 2026-10-09
// Why: The sentence a screen reader speaks for one day of the month grid. The
//      grid shows a day off by colour and an occasion by a dot; until 0.9.47 a
//      cell's accessible name was only «۱۲ مهر ۱۴۰۵», so a VoiceOver or
//      TalkBack user heard thirty numbers and could not tell which day was off.
//      Order is by use: today, weekday and date, «تعطیل», the occasions, the
//      visitor's own date, and the Gregorian date last, in Persian words so a
//      Persian voice reads it. The year is left off the Gregorian part: it is
//      spoken on every arrow press, and the month heading already says it.
//      todaySentence() is what the hero says first to a screen reader; shareText()
//      travels beside the day card, because a picture sent to Telegram has no alt.
// Env / Deps: lib/calendar, lib/events, lib/countdown. Pure, no React, so the extension and
//      any later caller (a widget sentence, a share text) can use it.
// ============================================================================

import { fa, GREGORIAN_MONTHS_FA, MONTHS, toCalendar, weekdayIndex, WEEKDAYS } from './calendar';
import { nextAnchors } from './countdown';
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

type LabelOptions = { months?: string[] };

// «امروز پنجشنبه ۱۶ مهر ۱۴۰۵، ۸ اکتبر. تعطیل نیست. ۷۴ روز تا شب یلدا.» — the question a
// person opening a calendar asks first is «is today off?», so the answer is said even
// when it is no. Then the nearer of Nowruz and Yalda, in whole days, as the countdown
// tool counts them.
export function todaySentence(now: Date, groups: EventGroups, { months = MONTHS }: LabelOptions = {}): string {
  const persian = toCalendar(now);
  const gregorian = toCalendar(now, 'gregorian');
  const weekday = weekdayIndex(now);
  const events = eventsForDate(now, groups);
  const off = weekday === 6 || events.some((event) => event.holiday);
  const occasions = events.map(occasionText).join('، ');
  const anchor = nextAnchors(now).filter((item) => item.days > 0).sort((a, b) => a.days - b.days)[0];
  return [
    `امروز ${WEEKDAYS[weekday]} ${fa(persian.day)} ${months[persian.month - 1]} ${fa(persian.year)}، ${fa(gregorian.day)} ${GREGORIAN_MONTHS_FA[gregorian.month - 1]}.`,
    off ? (occasions ? `تعطیل: ${occasions}.` : 'تعطیل.') : 'تعطیل نیست.',
    !off && occasions && `${occasions}.`,
    anchor && `${fa(anchor.days)} روز تا ${anchor.occasions[0].title}.`,
  ].filter(Boolean).join(' ');
}

// The text that goes with the day card. No «امروز»: whoever receives it reads it later.
export function shareText(date: Date, groups: EventGroups, { months = MONTHS }: LabelOptions = {}): string {
  return dayLabel(date, groups, { months });
}
