// ============================================================================
// Source: src/lib/events.test.ts
// Version: 0.2.0 — 2026-09-07
// Why: Unit tests for the events dataset, categories, scope filtering and
//      official 1405 lunar overrides.
// Env / Deps: Vitest.
// ============================================================================

import { describe, expect, it } from 'vitest';
import { fromCalendar } from './calendar';
import { EVENTS_NOTICE, eventsForDate } from './events';

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

  it.each([[1, 12], [3, 14], [3, 15], [11, 22]])('files state holidays %i/%i under the state category', (month, day) => {
    expect(eventsForDate(persian(month, day)).some((event) => event.holiday && event.category === 'state')).toBe(true);
  });

  // Default scope is the caller's choice; 'secular' must strip state and religious rows entirely,
  // including their holiday flag, so the grid does not shade a day it cannot explain.
  it('hides state and religious events in secular scope but keeps national and world ones', () => {
    const bahman22 = eventsForDate(persian(11, 22), 'secular');
    expect(bahman22.some((event) => event.category === 'state')).toBe(false);
    expect(bahman22.some((event) => event.holiday)).toBe(false);
    const ashura = fromCalendar({ year: 1405, month: 6, day: 8 });
    expect(eventsForDate(ashura, 'all').some((event) => event.category === 'religious')).toBe(true);
    expect(eventsForDate(ashura, 'secular').some((event) => event.category === 'religious')).toBe(false);
    expect(eventsForDate(persian(1, 1), 'secular')).toContainEqual(expect.objectContaining({ title: expect.stringContaining('نوروز'), holiday: true }));
    expect(eventsForDate(persian(9, 30), 'secular').some((event) => event.title.includes('یلدا'))).toBe(true);
    expect(eventsForDate(fromCalendar({ year: 2025, month: 12, day: 25 }, 'gregorian'), 'secular').some((event) => event.category === 'world')).toBe(true);
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
