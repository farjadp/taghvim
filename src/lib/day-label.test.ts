// ============================================================================
// Source: src/lib/day-label.test.ts
// Version: 0.1.0 — 2026-10-09
// Why: The sentence a screen reader speaks for a day cell must carry what the
//      grid shows by colour: the weekday, a day off, the occasions, the
//      Gregorian date — and must follow the visitor's groups like the shading.
// Env / Deps: Vitest.
// ============================================================================

import { describe, expect, it } from 'vitest';
import { fromCalendar, MONTHS } from './calendar';
import { ALL_GROUPS, DEFAULT_GROUPS, eventsForDate } from './events';
import { dayLabel, occasionText, STATE_MARK_LABEL } from './day-label';

const day = (year: number, month: number, d: number) => fromCalendar({ year, month, day: d });

describe('dayLabel', () => {
  it('opens with the weekday and the Persian date, and ends with the Gregorian one in Persian', () => {
    // 10 Mehr 1405 = 2 October 2026, a Friday
    const label = dayLabel(day(1405, 7, 10), DEFAULT_GROUPS);
    expect(label.startsWith('جمعه ۱۰ مهر ۱۴۰۵، ')).toBe(true);
    expect(label.endsWith('، ۲ اکتبر')).toBe(true);
  });

  it('says «تعطیل» on a day off, which the grid shows only by colour', () => {
    // 1 Farvardin 1405 = 21 March 2026, a Saturday: Nowruz
    const label = dayLabel(day(1405, 1, 1), DEFAULT_GROUPS);
    expect(label.startsWith('شنبه ۱ فروردین ۱۴۰۵، تعطیل، ')).toBe(true);
    for (const event of eventsForDate(day(1405, 1, 1), DEFAULT_GROUPS)) expect(label).toContain(event.title);
  });

  it('a plain weekday is not called a day off', () => {
    // 16 Mehr 1405 = 8 October 2026, a Thursday with no holiday
    expect(dayLabel(day(1405, 7, 16), DEFAULT_GROUPS)).not.toContain('تعطیل');
  });

  it('follows the groups exactly as the shading does', () => {
    // 22 Bahman is a `state` holiday: off by default, so neither said nor shaded
    const date = day(1405, 11, 22);
    expect(dayLabel(date, DEFAULT_GROUPS)).not.toContain('تعطیل');
    const all = dayLabel(date, ALL_GROUPS);
    expect(all).toContain('تعطیل');
    expect(all).toContain(STATE_MARK_LABEL);
  });

  it('names today and the visitor\'s own date when asked', () => {
    const label = dayLabel(day(1405, 7, 16), DEFAULT_GROUPS, { today: true, mine: 'تولد' });
    expect(label.startsWith('امروز، پنجشنبه')).toBe(true);
    expect(label).toContain('تاریخ من: تولد');
  });

  it('uses the month names the visitor chose', () => {
    const older = [...MONTHS];
    older[4] = 'امرداد';
    expect(dayLabel(day(1405, 5, 3), DEFAULT_GROUPS, { months: older })).toContain('۳ امرداد ۱۴۰۵');
  });
});

describe('occasionText', () => {
  it('speaks the state\'s mark the way the drawn mark is labelled', () => {
    expect(occasionText({ title: 'x', holiday: false, category: 'state' })).toBe(`${STATE_MARK_LABEL}: x`);
    expect(occasionText({ title: 'x', holiday: false, category: 'iran' })).toBe('x');
  });
});
