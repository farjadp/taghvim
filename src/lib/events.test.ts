// ============================================================================
// Source: src/lib/events.test.ts
// Version: 0.9.0 — 2026-09-08
// Why: Unit tests for the events dataset, independent group filtering and
//      official 1405 lunar overrides.
// Env / Deps: Vitest.
// ============================================================================

import { describe, expect, it } from 'vitest';
import { addDays, fromCalendar } from './calendar';
import { ALL_GROUPS, DEFAULT_GROUPS, EVENTS_NOTICE, eventsForDate, type EventGroups } from './events';

const combinations: EventGroups[] = Array.from({ length: 8 }, (_, mask) => ({
  religious: Boolean(mask & 1), state: Boolean(mask & 2), world: Boolean(mask & 4),
}));

const persian = (month: number, day: number) => fromCalendar({ year: 1404, month, day });

describe('selected calendar events', () => {
  it.each([1, 2, 3, 4])('marks Nowruz day %i as an Iranian holiday', (day) => {
    expect(eventsForDate(persian(1, day))).toContainEqual(expect.objectContaining({
      title: expect.stringContaining('نوروز'), holiday: true, category: 'iran',
    }));
  });

  it.each([[1, 13], [12, 29]])('includes fixed national holidays %i/%i', (month, day) => {
    expect(eventsForDate(persian(month, day)).some((event) => event.holiday && event.category === 'iran')).toBe(true);
  });

  // Farjad's editorial call, 9 Sep: the state's own commemorations do not carry the country's
  // name, and 22 Bahman is named for what it produced rather than for what it celebrates.
  it('never attaches «ایران» to a state occasion', () => {
    for (let month = 1; month <= 12; month += 1) {
      for (let day = 1; day <= 31; day += 1) {
        let events;
        try { events = eventsForDate(persian(month, day), ALL_GROUPS); } catch { continue; }
        for (const event of events.filter((item) => item.category === 'state')) {
          expect(event.title).not.toContain('ایران');
        }
      }
    }
  });

  it('names the two men as Farjad named them, wherever they appear', () => {
    // Khamenei has no occasion in this dataset; the guard exists so that adding one cannot
    // quietly reintroduce either name in its official form.
    for (let month = 1; month <= 12; month += 1) {
      for (let day = 1; day <= 31; day += 1) {
        let events;
        try { events = eventsForDate(persian(month, day), ALL_GROUPS); } catch { continue; }
        for (const { title } of events) {
          expect(title).not.toContain('امام خمینی');
          if (title.includes('خمینی')) expect(title).toContain('دجال زمان');
          if (title.includes('خامنه')) expect(title).toContain('ضحاک تاریخ');
        }
      }
    }
    expect(eventsForDate(persian(3, 14), ALL_GROUPS).some((event) => event.title.includes('دجال زمان'))).toBe(true);
  });

  it('names 22 Bahman as the uprising, not the victory', () => {
    const events = eventsForDate(persian(11, 22), ALL_GROUPS);
    expect(events.some((event) => event.category === 'state' && event.title.includes('شورش ۵۷'))).toBe(true);
    expect(events.every((event) => !event.title.includes('پیروزی انقلاب'))).toBe(true);
  });

  it.each([[1, 12], [3, 14], [3, 15], [11, 22]])('files state holidays %i/%i under the state category', (month, day) => {
    expect(eventsForDate(persian(month, day)).some((event) => event.holiday && event.category === 'state')).toBe(true);
  });

  it('exports app defaults while leaving the library default inclusive', () => {
    expect(DEFAULT_GROUPS).toEqual({ religious: false, state: false, world: true });
    expect(ALL_GROUPS).toEqual({ religious: true, state: true, world: true });
    expect(eventsForDate(persian(11, 22))).toEqual(eventsForDate(persian(11, 22), ALL_GROUPS));
  });

  // Disabled rows, including holiday flags, must disappear from both list and shading.
  it.each(combinations)('filters a full override year independently: %j', (groups) => {
    const start = fromCalendar({ year: 1405, month: 1, day: 1 });
    const end = fromCalendar({ year: 1406, month: 1, day: 1 });
    for (let date = start; date < end; date = addDays(date, 1)) {
      const all = eventsForDate(date);
      const visible = eventsForDate(date, groups);
      expect(visible).toEqual(all.filter((event) => event.category === 'iran' || groups[event.category]));
      expect(visible.filter((event) => event.category === 'iran')).toEqual(all.filter((event) => event.category === 'iran'));
      expect(visible.filter((event) => event.holiday)).toEqual(all.filter((event) => event.holiday && (event.category === 'iran' || groups[event.category])));
    }
  });

  it.each(combinations)('keeps Ashura independent of 22 Bahman: %j', (groups) => {
    const ashura = fromCalendar({ year: 1447, month: 1, day: 10 }, 'islamic');
    expect(eventsForDate(ashura, groups).some((event) => event.title === 'عاشورا' && event.holiday)).toBe(groups.religious);
    expect(eventsForDate(persian(11, 22), groups).some((event) => event.category === 'state' && event.holiday)).toBe(groups.state);
  });

  it('removes hidden holidays entirely and allows world events to be switched off', () => {
    expect(eventsForDate(persian(11, 22), DEFAULT_GROUPS).some((event) => event.holiday)).toBe(false);
    const ashura = fromCalendar({ year: 1447, month: 1, day: 10 }, 'islamic');
    expect(eventsForDate(ashura, DEFAULT_GROUPS).some((event) => event.holiday)).toBe(false);
    const christmas = fromCalendar({ year: 2025, month: 12, day: 25 }, 'gregorian');
    expect(eventsForDate(christmas, DEFAULT_GROUPS).some((event) => event.category === 'world')).toBe(true);
    expect(eventsForDate(christmas, { ...ALL_GROUPS, world: false }).some((event) => event.category === 'world')).toBe(false);
  });

  it.each(combinations)('returns fresh objects across every enabled source: %j', (groups) => {
    const dates = [persian(1, 1), persian(11, 22), fromCalendar({ year: 1405, month: 6, day: 8 }), new Date('2025-12-25T12:00:00Z')];
    for (const date of dates) {
      const original = eventsForDate(date, groups);
      const expected = structuredClone(original);
      original.forEach((event) => { event.title = 'changed'; event.holiday = !event.holiday; });
      original.length = 0;
      expect(eventsForDate(date, groups)).toEqual(expected);
    }
  });

  it.each(combinations)('preserves override dates and suppresses computed duplicates: %j', (groups) => {
    const overrides = [[6, 8, 'میلاد پیامبر'], [10, 2, 'میلاد امام علی'], [10, 16, 'مبعث']] as const;
    const start = fromCalendar({ year: 1405, month: 1, day: 1 });
    const end = fromCalendar({ year: 1406, month: 1, day: 1 });
    for (const [month, day, title] of overrides) {
      const matches: Date[] = [];
      for (let date = start; date < end; date = addDays(date, 1)) {
        for (const event of eventsForDate(date, groups)) {
          if (event.category === 'religious' && event.title.includes(title)) matches.push(date);
        }
      }
      expect(matches).toEqual(groups.religious ? [fromCalendar({ year: 1405, month, day })] : []);
    }
  });

  it.each([
    [1, 25, 'عطار'], [2, 25, 'فردوسی'], [3, 1, 'ملاصدرا'], [4, 10, 'صنعت'],
    [4, 14, 'قلم'], [5, 17, 'خبرنگار'], [6, 27, 'شعر'], [7, 20, 'حافظ'],
    [8, 24, 'کتاب'], [9, 30, 'یلدا'], [10, 5, 'زلزله'], [12, 5, 'مهندس'],
  ])('includes selected event %i/%i: %s', (month, day, title) => {
    expect(eventsForDate(persian(month, day)).some((event) => event.title.includes(title))).toBe(true);
  });

  it.each([
    [1, 'پزشک'], [1, 'ابوعلی سینا'], [1, 'همدان'], [4, 'کارمند'],
    [5, 'داروساز'], [5, 'رازی'], [11, 'چاپ'], [12, 'بهورز'],
    [13, 'تعاون'], [13, 'ابوریحان'], [21, 'سینما'], [27, 'شهریار'], [27, 'شعر'],
  ])('includes Shahrivar %i: %s as a national event (lunar holidays may overlap)', (day, title) => {
    const events = eventsForDate(persian(6, day));
    expect(events.some((event) => event.category === 'iran' && event.title.includes(title))).toBe(true);
  });

  it.each([[2, 'دولت'], [8, 'تروریسم'], [17, 'شهریور'], [31, 'دفاع مقدس'], [19, 'طالقانی']])('files Shahrivar %i: %s under the state category', (day, title) => {
    const events = eventsForDate(persian(6, day));
    expect(events.some((event) => event.category === 'state' && event.title.includes(title))).toBe(true);
    expect(events.some((event) => event.category === 'iran' && event.title.includes(title))).toBe(false);
  });

  it.each([
    [1, 1, 'سال نو'], [3, 8, 'زنان'], [4, 22, 'زمین'], [5, 1, 'کارگر'],
    [6, 5, 'محیط زیست'], [7, 11, 'جمعیت'], [8, 12, 'جوانان'],
    [9, 8, 'سوادآموزی'], [9, 21, 'صلح'], [10, 5, 'معلم'],
    [11, 20, 'کودک'], [12, 10, 'حقوق بشر'], [12, 25, 'کریسمس'],
  ])('includes Gregorian international observance %i/%i', (month, day, title) => {
    const date = fromCalendar({ year: 2025, month, day }, 'gregorian');
    expect(eventsForDate(date)).toContainEqual(expect.objectContaining({
      title: expect.stringContaining(title), holiday: false, category: 'world',
    }));
  });

  it('looks up both calendars using the Tehran day, not UTC or host-local day', () => {
    const events = eventsForDate(new Date('2025-03-20T20:30:00Z'));
    expect(events.some((event) => event.title.includes('نوروز'))).toBe(true);
    expect(events.some((event) => event.title.includes('نوروز') && event.category === 'world')).toBe(true);
  });

  it('returns independent arrays and event objects', () => {
    const date = persian(1, 1);
    const original = eventsForDate(date);
    const expected = structuredClone(original);
    original[0].title = 'changed';
    original.length = 0;
    expect(eventsForDate(date)).toEqual(expected);
  });

  it('discloses limited coverage and computational lunar calendar notice', () => {
    expect(EVENTS_NOTICE).toContain('گزیده');
    expect(EVENTS_NOTICE).toContain('رسمی');
    expect(EVENTS_NOTICE).toContain('قمری');
    expect(EVENTS_NOTICE).toContain('islamic-civil');
    expect(() => eventsForDate(new Date(NaN))).toThrow(RangeError);
  });

  it('prioritizes official 1405 dates over computational lunar dates', () => {
    const shahrivar8 = eventsForDate(fromCalendar({ year: 1405, month: 6, day: 8 }));
    expect(shahrivar8).toContainEqual(expect.objectContaining({
      title: expect.stringContaining('میلاد پیامبر'), holiday: true, category: 'religious',
    }));

    const shahrivar9 = eventsForDate(fromCalendar({ year: 1405, month: 6, day: 9 }));
    expect(shahrivar9.some((event) => event.title.includes('میلاد پیامبر') && event.holiday)).toBe(false);

    const dey2 = eventsForDate(fromCalendar({ year: 1405, month: 10, day: 2 }));
    expect(dey2).toContainEqual(expect.objectContaining({
      title: expect.stringContaining('میلاد امام علی'), holiday: true, category: 'religious',
    }));

    const dey16 = eventsForDate(fromCalendar({ year: 1405, month: 10, day: 16 }));
    expect(dey16).toContainEqual(expect.objectContaining({
      title: expect.stringContaining('مبعث'), holiday: true, category: 'religious',
    }));
  });
});
