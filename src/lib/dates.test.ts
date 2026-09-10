// ============================================================================
// Source: src/lib/dates.test.ts
// Version: 0.2.0 — 2026-09-10
// Why: Unit tests for the personal dates: storage guards, validation, the
//      30 Esfand leap case, ordering, the three rhythms, the migration of rows
//      written before categories existed, and the .ics export's line rules.
// Env / Deps: Vitest with an in-memory Storage stub.
// ============================================================================

import { describe, expect, it } from 'vitest';
import { dayKey, fromCalendar, toCalendar } from './calendar';
import {
  addDate, buildDatesFile, DATES_KEY, DATES_NOTICE, datesOn, EXPORT_MONTHS, MAX_DATES,
  nextOccurrence, occurrenceIn, readDates, removeDate, saveDates, upcomingDates,
  type Anniversary,
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
  ({ id: 'a1', title: 'تولد مریم', category: 'birthday', repeat: 'yearly', month: 3, day: 12, year: 1370, ...over });

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
    const raw = JSON.stringify([entry(), { id: 'b', title: '' }, entry({ id: 'c', month: 13 }), entry({ id: 'd', title: 'سالگرد', category: 'anniversary', repeat: 'yearly', year: null })]);
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
    expect(() => addDate([], { title: '  ', category: 'birthday', repeat: 'yearly', month: 1, day: 1, year: null })).toThrow(/عنوان/);
    expect(() => addDate([], { title: 'x', category: 'birthday', repeat: 'yearly', month: 7, day: 31, year: null })).toThrow(RangeError);
    expect(() => addDate([], { title: 'x', category: 'birthday', repeat: 'yearly', month: 1, day: 1, year: 1199 })).toThrow(RangeError);
  });

  it('accepts 30 Esfand, which is a real birthday in a leap year', () => {
    const list = addDate([], { title: 'تولد', category: 'birthday', repeat: 'yearly', month: 12, day: 30, year: 1403 });
    expect(list[0].day).toBe(30);
  });

  it('trims the title, assigns a unique id and refuses to grow past the cap', () => {
    const list = addDate([], { title: '  تولد علی  ', category: 'birthday', repeat: 'yearly', month: 2, day: 3, year: null });
    expect(list[0].title).toBe('تولد علی');
    expect(addDate(list, { title: 'دوم', category: 'birthday', repeat: 'yearly', month: 2, day: 3, year: null })[1].id)
      .not.toBe(list[0].id);
    const full = Array.from({ length: MAX_DATES }, (_, i) => entry({ id: `x${i}` }));
    expect(() => addDate(full, { title: 'y', category: 'birthday', repeat: 'yearly', month: 1, day: 1, year: null })).toThrow(RangeError);
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
  const file = () => buildDatesFile([entry(), entry({ id: 'b1', title: 'سالگرد', category: 'anniversary', repeat: 'yearly', month: 1, day: 5, year: null })], persian(1405, 6, 18), 3);

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

describe('the three rhythms', () => {
  // 15 Shahrivar 1405. Every case below is read against this one day.
  const now = persian(1405, 6, 15);

  it('a monthly entry lands on this month when the day is still ahead, next month when it is not', () => {
    const ahead = nextOccurrence(entry({ category: 'instalment', repeat: 'monthly', month: null, day: 20, year: null }), now);
    expect(toCalendar(ahead.date)).toMatchObject({ year: 1405, month: 6, day: 20 });
    expect(ahead.days).toBe(5);
    const behind = nextOccurrence(entry({ category: 'instalment', repeat: 'monthly', month: null, day: 3, year: null }), now);
    expect(toCalendar(behind.date)).toMatchObject({ year: 1405, month: 7, day: 3 });
  });

  it('rolls a monthly entry into the next year from Esfand, and clamps a 31st to the month it lands in', () => {
    const esfand = persian(1405, 12, 20);
    const rolled = nextOccurrence(entry({ repeat: 'monthly', category: 'instalment', month: null, day: 5, year: null }), esfand);
    expect(toCalendar(rolled.date)).toMatchObject({ year: 1406, month: 1, day: 5 });
    // Mehr has 30 days, so «every 31st» is the 30th there — never a jump into Aban.
    const clamped = nextOccurrence(entry({ repeat: 'monthly', category: 'instalment', month: null, day: 31, year: null }), persian(1405, 7, 1));
    expect(toCalendar(clamped.date)).toMatchObject({ year: 1405, month: 7, day: 30 });
  });

  it('a one-off keeps its own year and reports a past date as negative', () => {
    const future = nextOccurrence(entry({ category: 'work', repeat: 'once', month: 8, day: 1, year: 1405 }), now);
    expect(future.days).toBeGreaterThan(0);
    expect(future.years).toBeNull();
    const past = nextOccurrence(entry({ category: 'work', repeat: 'once', month: 2, day: 1, year: 1405 }), now);
    expect(past.days).toBeLessThan(0);
  });

  it('drops a past one-off from the upcoming list but keeps every repeating entry', () => {
    const list = [
      entry({ id: 'past', category: 'work', repeat: 'once', month: 2, day: 1, year: 1405 }),
      entry({ id: 'soon', category: 'work', repeat: 'once', month: 8, day: 1, year: 1405 }),
      entry({ id: 'monthly', category: 'instalment', repeat: 'monthly', month: null, day: 20, year: null }),
      entry({ id: 'yearly' }),
    ];
    expect(upcomingDates(list, now).map((item) => item.entry.id)).toEqual(['monthly', 'soon', 'yearly']);
  });

  it('only a yearly birthday counts years; a monthly instalment has no age', () => {
    expect(nextOccurrence(entry({ year: 1370 }), now).years).toBe(36);
    expect(nextOccurrence(entry({ category: 'instalment', repeat: 'monthly', month: null, day: 1, year: null }), now).years).toBeNull();
  });

  it('marks the calendar cell for each rhythm, and only the right one', () => {
    const monthly = entry({ id: 'm', category: 'instalment', repeat: 'monthly', month: null, day: 12, year: null });
    const once = entry({ id: 'o', category: 'work', repeat: 'once', month: 3, day: 12, year: 1405 });
    const list = [entry(), monthly, once];
    // 12 Khordad 1405: the yearly birthday, the monthly day, and the one-off all fall here
    expect(datesOn(list, persian(1405, 3, 12)).map((item) => item.id)).toEqual(['a1', 'm', 'o']);
    // Same day one year later: the one-off is over, the other two are not
    expect(datesOn(list, persian(1406, 3, 12)).map((item) => item.id)).toEqual(['a1', 'm']);
    // A month with no birthday: only the monthly one marks it
    expect(datesOn(list, persian(1405, 5, 12)).map((item) => item.id)).toEqual(['m']);
  });

  it('refuses a draft whose fields do not match its rhythm', () => {
    expect(() => addDate([], { title: 'قسط', category: 'instalment', repeat: 'monthly', month: 3, day: 1, year: null })).toThrow(RangeError);
    expect(() => addDate([], { title: 'جلسه', category: 'work', repeat: 'once', month: 3, day: 1, year: null })).toThrow(/سال/);
    expect(() => addDate([], { title: 'قسط', category: 'instalment', repeat: 'monthly', month: null, day: 32, year: null })).toThrow(RangeError);
  });
});

describe('rows written before categories existed', () => {
  it('migrates a stored `kind` rather than discarding it', () => {
    const legacy = JSON.stringify([
      { id: 'old1', title: 'تولد مریم', kind: 'birthday', month: 3, day: 12, year: 1370 },
      { id: 'old2', title: 'سالگرد شرکت', kind: 'anniversary', month: 5, day: 2, year: null },
    ]);
    const list = readDates(() => storage({ [DATES_KEY]: legacy }).stub);
    expect(list).toHaveLength(2);
    // 'anniversary' keeps a category of its own: a work anniversary is not a romance
    expect(list.map((item) => [item.category, item.repeat])).toEqual([['birthday', 'yearly'], ['anniversary', 'yearly']]);
    expect(list[0].month).toBe(3);
  });

  it('still drops a legacy row that was malformed to begin with', () => {
    const legacy = JSON.stringify([{ id: 'bad', title: '', kind: 'birthday', month: 3, day: 12, year: null }]);
    expect(readDates(() => storage({ [DATES_KEY]: legacy }).stub)).toEqual([]);
  });
});

describe('the export, per rhythm', () => {
  const now = persian(1405, 6, 15);
  const eventsIn = (entries: Anniversary[]) =>
    (buildDatesFile(entries, now).match(/BEGIN:VEVENT/g) ?? []).length;

  it('writes two years of a monthly entry, ten of a yearly one, and one of a one-off', () => {
    expect(eventsIn([entry({ category: 'instalment', repeat: 'monthly', month: null, day: 20, year: null })])).toBe(EXPORT_MONTHS);
    expect(eventsIn([entry()])).toBe(10);
    expect(eventsIn([entry({ category: 'work', repeat: 'once', month: 8, day: 1, year: 1405 })])).toBe(1);
  });

  it('leaves a past one-off out of someone\'s calendar entirely', () => {
    expect(eventsIn([entry({ category: 'work', repeat: 'once', month: 2, day: 1, year: 1405 })])).toBe(0);
  });

  it('gives every monthly event its own UID, or a calendar collapses them into one', () => {
    const text = buildDatesFile([entry({ id: 'm1', category: 'instalment', repeat: 'monthly', month: null, day: 20, year: null })], now);
    const uids = new Set(text.match(/^UID:.*$/gm));
    expect(uids.size).toBe(EXPORT_MONTHS);
  });

  it('keeps the age sentence for a birthday and writes none for an instalment', () => {
    expect(buildDatesFile([entry()], now)).toContain('سالگی');
    expect(buildDatesFile([entry({ category: 'instalment', repeat: 'monthly', month: null, day: 20, year: null })], now)).not.toContain('سالگی');
  });
});
