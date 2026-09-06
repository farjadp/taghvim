import { describe, expect, it } from 'vitest';
import {
  MONTHS, WEEKDAYS, ISLAMIC_NOTICE, addDays, dateNumbers, dayKey, daysBetween,
  fa, formatDate, fromCalendar, monthGrid, monthLength, shiftMonth, toCalendar,
  type CalendarDate, type CalendarKind,
} from './calendar';

const civil = (year: number, month: number, day: number): CalendarDate => ({ year, month, day });

describe('calendar conversion', () => {
  it.each([
    [1399, 1, 1, '2020-03-20'],
    [1399, 12, 30, '2021-03-20'],
    [1400, 1, 1, '2021-03-21'],
    [1403, 1, 1, '2024-03-20'],
    [1403, 12, 30, '2025-03-20'],
    [1404, 1, 1, '2025-03-21'],
  ])('roundtrips %i/%i/%i', (year, month, day, gregorian) => {
    const value = civil(year, month, day);
    const result = fromCalendar(value);
    expect(result.toISOString()).toBe(`${gregorian}T12:00:00.000Z`);
    expect(toCalendar(result)).toEqual(value);
    expect(dayKey(result)).toBe(gregorian);
  });

  it('reads the Tehran civil day on either side of midnight', () => {
    expect(toCalendar(new Date('2025-03-20T20:29:59.999Z'))).toEqual(civil(1403, 12, 30));
    expect(toCalendar(new Date('2025-03-20T20:30:00.000Z'))).toEqual(civil(1404, 1, 1));
    expect(dayKey(new Date('2025-03-20T20:30:00.000Z'))).toBe('2025-03-21');
    expect(toCalendar(new Date('2021-07-01T19:30:00Z'), 'gregorian')).toEqual(civil(2021, 7, 2));
  });

  it('roundtrips Gregorian leap days without allowing overflow', () => {
    expect(toCalendar(fromCalendar(civil(2024, 2, 29), 'gregorian'), 'gregorian')).toEqual(civil(2024, 2, 29));
    expect(monthLength(2024, 2, 'gregorian')).toBe(29);
    expect(monthLength(2100, 2, 'gregorian')).toBe(28);
    expect(() => fromCalendar(civil(2025, 2, 29), 'gregorian')).toThrow(RangeError);
  });

  it.each([
    [1400, 12, 30], [1404, 7, 31], [1404, 0, 1], [1404, 13, 1],
    [1404, 1, 0], [1404, 1, 32], [1404.5, 1, 1], [1404, 1.5, 1],
    [1404, 1, 1.5], [NaN, 1, 1], [Infinity, 1, 1], [1199, 12, 29], [1601, 1, 1],
  ])('rejects invalid Persian date %s/%s/%s', (year, month, day) => {
    expect(() => fromCalendar(civil(year, month, day))).toThrow(RangeError);
  });

  it('validates every calendar kind and invalid Date input', () => {
    expect(() => toCalendar(new Date(NaN))).toThrow(RangeError);
    expect(() => dayKey(new Date(NaN))).toThrow(RangeError);
    expect(() => toCalendar(new Date('-002024-03-20T12:00:00Z'))).toThrow(RangeError);
    expect(() => toCalendar(new Date(), 'invalid' as CalendarKind)).toThrow(RangeError);
    expect(() => fromCalendar(civil(2025, 4, 31), 'gregorian')).toThrow(RangeError);
    expect(() => fromCalendar(civil(2025, 1, 1.2), 'gregorian')).toThrow(RangeError);
    expect(() => monthLength(1404, 13)).toThrow(RangeError);
    expect(() => monthLength(1404.1, 1)).toThrow(RangeError);
    expect(() => monthLength(1700, 1, 'gregorian')).toThrow(RangeError);
  });

  it('enforces identical civil-day bounds in all three calendars', () => {
    const first = fromCalendar(civil(1200, 1, 1));
    const last = fromCalendar(civil(1600, 12, monthLength(1600, 12)));
    for (const kind of ['persian', 'gregorian', 'islamic'] as const) {
      expect(fromCalendar(toCalendar(first, kind), kind)).toEqual(first);
      expect(fromCalendar(toCalendar(last, kind), kind)).toEqual(last);
      expect(() => toCalendar(new Date(first.getTime() - 86400000), kind)).toThrow(RangeError);
      expect(() => toCalendar(new Date(last.getTime() + 86400000), kind)).toThrow(RangeError);
    }
    expect(() => addDays(first, -1)).toThrow(RangeError);
    expect(() => addDays(last, 1)).toThrow(RangeError);
    expect(() => fromCalendar(civil(1800, 1, 1), 'gregorian')).toThrow(RangeError);
    expect(() => fromCalendar(civil(2300, 1, 1), 'gregorian')).toThrow(RangeError);
  });
});

describe('civil arithmetic and grids', () => {
  it('adds signed civil days and normalizes to UTC noon without mutating', () => {
    const source = new Date('2025-03-20T20:30:00Z');
    expect(addDays(source, 0).toISOString()).toBe('2025-03-21T12:00:00.000Z');
    expect(addDays(source, -1).toISOString()).toBe('2025-03-20T12:00:00.000Z');
    expect(addDays(source, 10).toISOString()).toBe('2025-03-31T12:00:00.000Z');
    expect(source.toISOString()).toBe('2025-03-20T20:30:00.000Z');
    expect(() => addDays(source, 0.5)).toThrow(RangeError);
    expect(() => addDays(source, Infinity)).toThrow(RangeError);
  });

  it('counts signed Tehran civil days, including historical DST transitions', () => {
    const a = new Date('2021-09-21T19:29:59Z');
    const b = new Date('2021-09-22T20:30:00Z');
    expect(daysBetween(a, b)).toBe(2);
    expect(daysBetween(b, a)).toBe(-2);
    expect(daysBetween(a, a)).toBe(0);
  });

  it('shifts months in either direction and validates bounds', () => {
    expect(shiftMonth(1403, 12, 1)).toEqual({ year: 1404, month: 1 });
    expect(shiftMonth(1404, 1, -1)).toEqual({ year: 1403, month: 12 });
    expect(shiftMonth(1404, 1, -25)).toEqual({ year: 1401, month: 12 });
    expect(() => shiftMonth(1200, 1, -1)).toThrow(RangeError);
    expect(() => shiftMonth(1600, 12, 1)).toThrow(RangeError);
    expect(() => shiftMonth(1404, 1, 1.2)).toThrow(RangeError);
    expect(() => shiftMonth(1404, 13, 0)).toThrow(RangeError);
  });

  it.each([[1404, 1, 42], [1404, 6, 35], [1403, 12, 35]])('builds Saturday-first grid %i/%i', (year, month, count) => {
    const grid = monthGrid(year, month);
    expect(grid).toHaveLength(count);
    expect(grid[0].date.getUTCDay()).toBe(6);
    expect(grid.at(-1)?.date.getUTCDay()).toBe(5);
    expect(grid.filter((cell) => cell.inMonth)).toHaveLength(monthLength(year, month));
    grid.forEach((cell, index) => {
      expect(cell.date.getUTCHours()).toBe(12);
      expect(cell.isFriday).toBe(index % 7 === 6);
      expect(cell.persian).toEqual(toCalendar(cell.date));
      expect(cell.inMonth).toBe(cell.persian.year === year && cell.persian.month === month);
      if (index) expect(daysBetween(grid[index - 1].date, cell.date)).toBe(1);
    });
  });

  it('keeps complete boundary grids with adjacent-year padding', () => {
    for (const [year, month] of [[1200, 1], [1600, 12]]) {
      const grid = monthGrid(year, month);
      expect([35, 42]).toContain(grid.length);
      expect(grid[0].date.getUTCDay()).toBe(6);
      expect(grid.filter((cell) => cell.inMonth)).toHaveLength(monthLength(year, month));
    }
  });

  it('returns Persian leap month lengths', () => {
    expect(monthLength(1403, 12)).toBe(30);
    expect(monthLength(1404, 12)).toBe(29);
    expect(monthLength(1404, 6)).toBe(31);
    expect(monthLength(1404, 7)).toBe(30);
  });
});

describe('Islamic civil calendar', () => {
  it('uses islamic-civil, not observational Iranian lunar dates', () => {
    expect(toCalendar(new Date('2024-07-08T12:00:00Z'), 'islamic')).toEqual(civil(1446, 1, 1));
    expect(ISLAMIC_NOTICE).toContain('محاسباتی');
    expect(ISLAMIC_NOTICE).toContain('رسمی');
  });

  it('roundtrips every month and rejects impossible leap dates', () => {
    for (const year of [1300, 1445, 1446, 1500, 1600]) {
      for (let month = 1; month <= 12; month += 1) {
        const length = monthLength(year, month, 'islamic');
        expect([29, 30]).toContain(length);
        for (const day of [1, length]) {
          const value = civil(year, month, day);
          expect(toCalendar(fromCalendar(value, 'islamic'), 'islamic')).toEqual(value);
        }
        expect(() => fromCalendar(civil(year, month, length + 1), 'islamic')).toThrow(RangeError);
      }
    }
    expect(monthLength(1445, 12, 'islamic')).toBe(30);
    expect(monthLength(1446, 12, 'islamic')).toBe(29);
    expect(() => fromCalendar(civil(1446, 0, 1), 'islamic')).toThrow(RangeError);
    expect(() => fromCalendar(civil(1446, 1, 1.5), 'islamic')).toThrow(RangeError);
    expect(() => fromCalendar(civil(100, 1, 1), 'islamic')).toThrow(RangeError);
    expect(() => monthLength(3000, 1, 'islamic')).toThrow(RangeError);
  });
});

describe('display helpers', () => {
  it('exports twelve Persian months and Saturday-first full weekdays', () => {
    expect(MONTHS).toHaveLength(12);
    expect(MONTHS[5]).toBe('شهریور');
    expect(WEEKDAYS).toEqual(['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه', 'جمعه']);
  });

  it('replaces digits without grouping or altering text', () => {
    expect(fa(1234567890)).toBe('۱۲۳۴۵۶۷۸۹۰');
    expect(fa('-1404/06/01')).toBe('-۱۴۰۴/۰۶/۰۱');
    expect(fa('شنبه 12')).toBe('شنبه ۱۲');
  });

  it('formats padded calendar numbers', () => {
    const date = fromCalendar(civil(1404, 1, 1));
    expect(dateNumbers(date)).toBe('۱۴۰۴/۰۱/۰۱');
    expect(dateNumbers(date, 'gregorian')).toBe('2025-03-21');
    expect(dateNumbers(new Date('2024-07-08T12:00:00Z'), 'islamic')).toBe('۱۴۴۶/۰۱/۰۱');
  });

  it('formats month names with an optional Tehran weekday', () => {
    const date = fromCalendar(civil(1404, 1, 1));
    expect(formatDate(date)).toBe('۱ فروردین ۱۴۰۴');
    expect(formatDate(date, 'persian', true)).toBe('جمعه، ۱ فروردین ۱۴۰۴');
    expect(formatDate(date, 'gregorian')).toContain('March');
    expect(formatDate(date, 'gregorian', true)).toBe('Friday, 21 March 2025');
    expect(formatDate(new Date('2024-07-08T12:00:00Z'), 'islamic')).toContain('محرم');
  });
});
