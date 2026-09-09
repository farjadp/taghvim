// ============================================================================
// Source: src/lib/dates.test.ts
// Version: 0.1.0 — 2026-09-09
// Why: Unit tests for the personal dates: storage guards, validation, the
//      30 Esfand leap case, ordering, and the .ics export's line rules.
// Env / Deps: Vitest with an in-memory Storage stub.
// ============================================================================

import { describe, expect, it } from 'vitest';
import { dayKey, fromCalendar, toCalendar } from './calendar';
import {
  addDate, buildDatesFile, DATES_KEY, DATES_NOTICE, datesOn, MAX_DATES, nextOccurrence,
  occurrenceIn, readDates, removeDate, saveDates, upcomingDates, type Anniversary,
} from './dates';

const persian = (year: number, month: number, day: number) => fromCalendar({ year, month, day });

function storage(initial: Record<string, string> = {}) {
  const map = new Map(Object.entries(initial));
  const stub = {
    getItem: (key: string) => map.get(key) ?? null,
    setItem: (key: string, value: string) => { map.set(key, value); },
    removeItem: (key: string) => { map.delete(key); },
  } as unknown as Storage;
  return { stub, map };
}

const entry = (over: Partial<Anniversary> = {}): Anniversary =>
  ({ id: 'a1', title: 'تولد مریم', kind: 'birthday', month: 3, day: 12, year: 1370, ...over });

describe('storage', () => {
  it('round-trips a list', () => {
    const { stub } = storage();
    saveDates([entry()], () => stub);
    expect(readDates(() => stub)).toEqual([entry()]);
  });

  it('returns an empty list for missing, corrupt or non-array data', () => {
    expect(readDates(() => storage().stub)).toEqual([]);
    expect(readDates(() => storage({ [DATES_KEY]: 'not json' }).stub)).toEqual([]);
    expect(readDates(() => storage({ [DATES_KEY]: '{"a":1}' }).stub)).toEqual([]);
  });

  it('keeps the good entries and drops only the malformed ones', () => {
    const raw = JSON.stringify([entry(), { id: 'b', title: '' }, entry({ id: 'c', month: 13 }), entry({ id: 'd', title: 'سالگرد', kind: 'anniversary', year: null })]);
    const list = readDates(() => storage({ [DATES_KEY]: raw }).stub);
    expect(list.map((item) => item.id)).toEqual(['a1', 'd']);
  });

  it('never lets a read or a write throw', () => {
    const throwing = () => { throw new Error('denied'); };
    expect(readDates(throwing)).toEqual([]);
    expect(() => saveDates([entry()], throwing)).not.toThrow();
  });
});

describe('adding', () => {
  it('rejects an empty title and a bad date, in Persian', () => {
    expect(() => addDate([], { title: '  ', kind: 'birthday', month: 1, day: 1, year: null })).toThrow(/عنوان/);
    expect(() => addDate([], { title: 'x', kind: 'birthday', month: 7, day: 31, year: null })).toThrow(RangeError);
    expect(() => addDate([], { title: 'x', kind: 'birthday', month: 1, day: 1, year: 1199 })).toThrow(RangeError);
  });

  it('accepts 30 Esfand, which is a real birthday in a leap year', () => {
    const list = addDate([], { title: 'تولد', kind: 'birthday', month: 12, day: 30, year: 1403 });
    expect(list[0].day).toBe(30);
  });

  it('trims the title, assigns a unique id and refuses to grow past the cap', () => {
    const list = addDate([], { title: '  تولد علی  ', kind: 'birthday', month: 2, day: 3, year: null });
    expect(list[0].title).toBe('تولد علی');
    expect(addDate(list, { title: 'دوم', kind: 'birthday', month: 2, day: 3, year: null })[1].id)
      .not.toBe(list[0].id);
    const full = Array.from({ length: MAX_DATES }, (_, i) => entry({ id: `x${i}` }));
    expect(() => addDate(full, { title: 'y', kind: 'birthday', month: 1, day: 1, year: null })).toThrow(RangeError);
  });

  it('removes by id and leaves the rest alone', () => {
    const list = [entry(), entry({ id: 'b1' })];
    expect(removeDate(list, 'a1').map((item) => item.id)).toEqual(['b1']);
    expect(removeDate(list, 'missing')).toHaveLength(2);
  });
});

describe('next occurrence', () => {
  it('is today when the day is today', () => {
    const next = nextOccurrence(entry({ month: 6, day: 18 }), persian(1405, 6, 18));
    expect(next.days).toBe(0);
    expect(dayKey(next.date)).toBe(dayKey(persian(1405, 6, 18)));
  });

  it('rolls into next year once the day has passed', () => {
    const next = nextOccurrence(entry({ month: 3, day: 12 }), persian(1405, 6, 18));
    expect(toCalendar(next.date).year).toBe(1406);
    expect(next.days).toBeGreaterThan(0);
  });

  it('counts the years only when the birth year is known', () => {
    expect(nextOccurrence(entry({ month: 12, day: 1, year: 1370 }), persian(1405, 6, 18)).years).toBe(35);
    expect(nextOccurrence(entry({ year: null }), persian(1405, 6, 18)).years).toBeNull();
  });

  it('keeps a 30 Esfand birthday in Esfand when the year is not a leap year', () => {
    // 1404 has 29 days in Esfand; the day must clamp back, never spill into Farvardin.
    const clamped = occurrenceIn(entry({ month: 12, day: 30 }), 1404);
    expect(toCalendar(clamped)).toMatchObject({ month: 12, day: 29 });
    expect(toCalendar(occurrenceIn(entry({ month: 12, day: 30 }), 1403))).toMatchObject({ month: 12, day: 30 });
  });

  it('orders by nearness and honours a limit', () => {
    const now = persian(1405, 6, 18);
    const list = [entry({ id: 'far', month: 5, day: 1 }), entry({ id: 'near', month: 6, day: 20 }), entry({ id: 'mid', month: 9, day: 1 })];
    expect(upcomingDates(list, now).map((item) => item.entry.id)).toEqual(['near', 'mid', 'far']);
    expect(upcomingDates(list, now, 2)).toHaveLength(2);
  });

  it('finds what falls on one day, with the leap clamp applied', () => {
    const list = [entry({ id: 'a', month: 12, day: 30 }), entry({ id: 'b', month: 1, day: 1 })];
    expect(datesOn(list, persian(1404, 12, 29)).map((item) => item.id)).toEqual(['a']);
    expect(datesOn(list, persian(1403, 12, 30)).map((item) => item.id)).toEqual(['a']);
    expect(datesOn(list, persian(1405, 1, 1)).map((item) => item.id)).toEqual(['b']);
  });
});

describe('the .ics export', () => {
  const file = () => buildDatesFile([entry(), entry({ id: 'b1', title: 'سالگرد', kind: 'anniversary', month: 1, day: 5, year: null })], persian(1405, 6, 18), 3);

  it('writes one dated event per year per entry, with stable ids', () => {
    const text = file();
    expect(text.match(/BEGIN:VEVENT/g)).toHaveLength(6);
    expect(text).toContain('UID:a1-1405@taghv.im');
    expect(text).toContain('DTSTART;VALUE=DATE:');
    // No RRULE: a yearly Gregorian rule drifts against the Solar Hijri year.
    expect(text).not.toContain('RRULE');
  });

  it('counts the years only where the year is known', () => {
    const text = file();
    expect(text).toContain('سالگی');
    expect(text).toContain('سالگرد');
  });

  it('obeys the RFC line rules the feed already enforces', () => {
    const text = buildDatesFile([entry({ title: 'تولد یک نفر با نامی بسیار بسیار طولانی که باید تا شود و از هفتاد و پنج اکتت رد می‌کند' })], persian(1405, 6, 18), 1);
    expect(text.endsWith('\r\n')).toBe(true);
    for (const line of text.split('\r\n')) {
      expect(Buffer.byteLength(line, 'utf8')).toBeLessThanOrEqual(75);
    }
  });

  it('says in every entry that the file does not update itself', () => {
    expect(file()).toContain('دوباره خروجی');
  });
});

it('the notice admits there is no sync and no server', () => {
  expect(DATES_NOTICE).toContain('همگام نمی‌شود');
  expect(DATES_NOTICE).toContain('مرورگر');
});
