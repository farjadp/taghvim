// ============================================================================
// Source: src/lib/ics.ts
// Version: 0.9.4 — 2026-09-08
// Why: Builds the iCalendar feed people subscribe to from Google or Apple
//      Calendar, so Iranian occasions appear inside the calendar they already
//      open every day. Solar occasions only — see SOLAR_ONLY_NOTICE.
// Env / Deps: lib/calendar for Jalali↔Gregorian, lib/events for the occasions.
//      Pure functions; the route in app/calendar.ics only serves the string.
// ============================================================================

import { fromCalendar, monthLength, toCalendar } from './calendar';
import { eventsForDate } from './events';

export const FEED_NAME = 'مناسبت‌های ملی و فرهنگی ایران';

// Shown inside the subscriber's calendar app. The feed deliberately carries no
// lunar holiday: those depend on sighting the crescent, and this project only
// has three official dates pinned. Naming it «تعطیلات رسمی» would make someone
// plan a week around it and miss تاسوعا, so the name and this line both say
// exactly what is inside.
export const SOLAR_ONLY_NOTICE =
  'مناسبت‌های ملی و فرهنگی ایران بر پایهٔ تاریخ ثابت شمسی. تعطیلات مذهبی قمری در این فهرست نیست، چون تاریخشان بر پایهٔ رؤیت هلال تعیین می‌شود. این فهرست تقویم رسمی کامل نیست. taghv.im';

// Subscriptions are refetched by the client, not pushed, so a rolling window is
// enough: last year for context, this year and three ahead for planning.
export const YEARS_BEHIND = 1;
export const YEARS_AHEAD = 3;

// RFC 5545 §3.3.11: backslash, semicolon and comma are escaped, newlines become
// a literal \n. Order matters — the backslash rule has to run first.
export function escapeText(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');
}

// RFC 5545 §3.1: no line may exceed 75 octets, and continuations start with a
// space. The limit is octets, not characters, and Persian text is 2 bytes per
// letter — so the split has to count encoded bytes and must never land inside a
// multi-byte sequence, or the subscriber gets replacement characters.
export function foldLine(line: string): string {
  const encoder = new TextEncoder();
  if (encoder.encode(line).length <= 75) return line;
  const parts: string[] = [];
  let current = '';
  let bytes = 0;
  // Iterating the string yields whole code points, so a character is never split.
  for (const character of line) {
    const size = encoder.encode(character).length;
    // 75 on the first line; continuations spend one octet on the leading space.
    const limit = parts.length === 0 ? 75 : 74;
    if (bytes + size > limit) {
      parts.push(current);
      current = '';
      bytes = 0;
    }
    current += character;
    bytes += size;
  }
  parts.push(current);
  return parts.join('\r\n ');
}

// YYYYMMDD in the Gregorian civil date this instant stands for.
function dateStamp(date: Date): string {
  const { year, month, day } = toCalendar(date, 'gregorian');
  return `${year}${String(month).padStart(2, '0')}${String(day).padStart(2, '0')}`;
}

export type FeedEvent = { date: Date; title: string; holiday: boolean; persian: { year: number; month: number; day: number } };

// Every 'iran' occasion in the window, in date order. State, religious and
// world categories are excluded: the first two are a product decision, and the
// religious ones are the dates this project cannot yet promise.
export function feedEvents(today: Date, yearsBehind = YEARS_BEHIND, yearsAhead = YEARS_AHEAD): FeedEvent[] {
  const current = toCalendar(today).year;
  const events: FeedEvent[] = [];
  for (let year = current - yearsBehind; year <= current + yearsAhead; year += 1) {
    for (let month = 1; month <= 12; month += 1) {
      for (let day = 1; day <= monthLength(year, month); day += 1) {
        const date = fromCalendar({ year, month, day });
        for (const event of eventsForDate(date, { religious: false, state: false, world: false })) {
          events.push({ date, title: event.title, holiday: event.holiday, persian: { year, month, day } });
        }
      }
    }
  }
  return events;
}

// A UID must be stable across refetches or every refresh duplicates the event.
// The Persian date plus a slot index is stable as long as a day's list keeps its
// order, which it does: the source is a literal array per date.
function uid(event: FeedEvent, slot: number): string {
  const { year, month, day } = event.persian;
  return `${year}-${month}-${day}-${slot}@taghv.im`;
}

export function buildFeed(today: Date, events = feedEvents(today)): string {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//taghv.im//Iranian Calendar//FA',
    'CALSCALE:GREGORIAN',
    `X-WR-CALNAME:${escapeText(FEED_NAME)}`,
    `X-WR-CALDESC:${escapeText(SOLAR_ONLY_NOTICE)}`,
    'X-WR-TIMEZONE:Asia/Tehran',
    // Both spellings exist in the wild; clients read one or the other.
    'REFRESH-INTERVAL;VALUE=DURATION:P1D',
    'X-PUBLISHED-TTL:P1D',
  ];
  // DTSTAMP is when the entry was produced. It is the same for every event here
  // and changes on each build, which is what tells a client the feed is fresh.
  const stamp = `${dateStamp(today)}T000000Z`;
  const perDay = new Map<string, number>();
  for (const event of events) {
    const key = `${event.persian.year}-${event.persian.month}-${event.persian.day}`;
    const slot = perDay.get(key) ?? 0;
    perDay.set(key, slot + 1);
    // All-day events: DTEND is exclusive, so it is the following day.
    const end = new Date(event.date.getTime() + 24 * 60 * 60 * 1000);
    lines.push(
      'BEGIN:VEVENT',
      `UID:${uid(event, slot)}`,
      `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${dateStamp(event.date)}`,
      `DTEND;VALUE=DATE:${dateStamp(end)}`,
      `SUMMARY:${escapeText(event.title)}`,
      `CATEGORIES:${escapeText(event.holiday ? 'تعطیل رسمی' : 'مناسبت')}`,
      'TRANSP:TRANSPARENT',
      'END:VEVENT',
    );
  }
  lines.push('END:VCALENDAR');
  // RFC 5545 §3.1 again: CRLF between lines, and the file ends with one.
  return `${lines.map(foldLine).join('\r\n')}\r\n`;
}
