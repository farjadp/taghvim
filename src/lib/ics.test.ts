// ============================================================================
// Source: src/lib/ics.test.ts
// Version: 0.9.4 — 2026-09-08
// Why: A subscription feed is read by machines and never looked at again, so
//      the line rules of RFC 5545 and the stability of UIDs are what keep it
//      from silently duplicating or corrupting events in someone's calendar.
// Env / Deps: Vitest; TextEncoder for octet counts.
// ============================================================================

import { describe, expect, it } from 'vitest';
import { fromCalendar, toCalendar } from './calendar';
import { FEED_NAME, SOLAR_ONLY_NOTICE, buildFeed, escapeText, feedEvents, foldLine } from './ics';

const octets = (value: string) => new TextEncoder().encode(value).length;
const TODAY = fromCalendar({ year: 1405, month: 6, day: 17 });
const unfold = (feed: string) => feed.replace(/\r\n[ \t]/g, '');

describe('escaping', () => {
  it('escapes the four characters RFC 5545 reserves, backslash first', () => {
    expect(escapeText('a\\b;c,d\ne')).toBe('a\\\\b\\;c\\,d\\ne');
  });

  it('leaves Persian text alone', () => {
    expect(escapeText('نوروز')).toBe('نوروز');
  });
});

describe('folding', () => {
  it('leaves a short line untouched', () => {
    expect(foldLine('SUMMARY:نوروز')).toBe('SUMMARY:نوروز');
  });

  it('never emits a line over 75 octets, counting bytes and not characters', () => {
    const line = `SUMMARY:${'مناسبت '.repeat(20)}`;
    for (const part of foldLine(line).split('\r\n')) expect(octets(part)).toBeLessThanOrEqual(75);
  });

  it('splits between characters, so unfolding restores the original exactly', () => {
    const line = `X-TEST:${'روز بزرگداشت حکیم عمر خیام '.repeat(6)}`;
    const folded = foldLine(line);
    expect(folded).toContain('\r\n ');
    expect(folded.replace(/\r\n /g, '')).toBe(line);
    // A split inside a UTF-8 sequence would surface here as a replacement char
    expect(folded).not.toContain('�');
  });
});

describe('feed contents', () => {
  const events = feedEvents(TODAY);

  it('covers a five-year window around today', () => {
    const years = new Set(events.map((event) => event.persian.year));
    expect([...years].sort()).toEqual([1404, 1405, 1406, 1407, 1408]);
  });

  it('carries national occasions and Nowruz as a holiday', () => {
    const nowruz = events.find((event) => event.persian.year === 1405 && event.persian.month === 1 && event.persian.day === 1);
    expect(nowruz?.title).toContain('نوروز');
    expect(nowruz?.holiday).toBe(true);
  });

  // The whole point of the solar-only feed: no date in it depends on a sighting.
  it('excludes every religious, state and world occasion', () => {
    const feed = unfold(buildFeed(TODAY));
    expect(feed).not.toContain('عاشورا');
    expect(feed).not.toContain('۲۲ بهمن');
    expect(feed).not.toContain('روز جمهوری اسلامی');
    expect(feed).not.toContain('کریسمس');
  });

  it('says in the calendar description that lunar holidays are absent', () => {
    expect(SOLAR_ONLY_NOTICE).toContain('قمری');
    expect(FEED_NAME).not.toContain('تعطیلات رسمی');
    expect(unfold(buildFeed(TODAY))).toContain(`X-WR-CALDESC:${SOLAR_ONLY_NOTICE.replace(/,/g, '\\,')}`);
  });
});

describe('feed structure', () => {
  const feed = buildFeed(TODAY);

  it('is CRLF throughout and ends with one', () => {
    expect(feed.replace(/\r\n/g, '')).not.toContain('\n');
    expect(feed.endsWith('\r\n')).toBe(true);
  });

  it('keeps every line inside 75 octets', () => {
    for (const line of feed.split('\r\n')) expect(octets(line)).toBeLessThanOrEqual(75);
  });

  it('opens and closes the calendar and every event', () => {
    const text = unfold(feed);
    expect(text.startsWith('BEGIN:VCALENDAR\r\n')).toBe(true);
    expect(text.trimEnd().endsWith('END:VCALENDAR')).toBe(true);
    expect((text.match(/BEGIN:VEVENT/g) ?? []).length).toBe((text.match(/END:VEVENT/g) ?? []).length);
  });

  // A UID that changes between fetches makes the client add the event again
  // instead of updating it, so a subscriber accumulates duplicates forever.
  it('gives every event a unique UID that is stable across builds', () => {
    const uids = (text: string) => [...text.matchAll(/^UID:(.*)$/gm)].map((match) => match[1]);
    const first = uids(unfold(feed));
    expect(new Set(first).size).toBe(first.length);
    // Same window, produced a day later: the identifiers must not move.
    const later = fromCalendar({ year: 1405, month: 6, day: 18 });
    expect(uids(unfold(buildFeed(later)))).toEqual(first);
  });

  it('writes all-day events whose exclusive end is the next day', () => {
    const text = unfold(feed);
    const nowruz = fromCalendar({ year: 1405, month: 1, day: 1 });
    const start = toCalendar(nowruz, 'gregorian');
    const stamp = `${start.year}${String(start.month).padStart(2, '0')}${String(start.day).padStart(2, '0')}`;
    expect(text).toContain(`DTSTART;VALUE=DATE:${stamp}`);
    const next = toCalendar(new Date(nowruz.getTime() + 86400000), 'gregorian');
    expect(text).toContain(`DTEND;VALUE=DATE:${next.year}${String(next.month).padStart(2, '0')}${String(next.day).padStart(2, '0')}`);
  });

  it('marks holidays and ordinary occasions with different categories', () => {
    const text = unfold(feed);
    expect(text).toContain('CATEGORIES:تعطیل رسمی');
    expect(text).toContain('CATEGORIES:مناسبت');
  });
});
