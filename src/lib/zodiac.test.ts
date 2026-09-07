// ============================================================================
// Source: src/lib/zodiac.test.ts
// Version: 0.8.0-sandbox — 2026-09-07
// Why: Guards the month-to-sign mapping and the element cycle, which are the
//      whole feature, plus the honesty notice.
// Env / Deps: Vitest.
// ============================================================================

import { describe, expect, it } from 'vitest';
import { SIGNS, ZODIAC_NOTICE, signFor, signProgress, signRange } from './zodiac';
import { fromCalendar } from './calendar';

const persian = (month: number, day: number) => fromCalendar({ year: 1405, month, day });

describe('zodiac signs', () => {
  it('covers twelve signs in Persian month order', () => {
    expect(SIGNS).toHaveLength(12);
    expect(SIGNS.map((sign) => sign.month)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
    expect(new Set(SIGNS.map((sign) => sign.name)).size).toBe(12);
    expect(new Set(SIGNS.map((sign) => sign.symbol)).size).toBe(12);
  });

  it('repeats the four elements three times each', () => {
    expect(SIGNS.map((sign) => sign.element)).toEqual([
      'آتش', 'خاک', 'باد', 'آب', 'آتش', 'خاک', 'باد', 'آب', 'آتش', 'خاک', 'باد', 'آب',
    ]);
  });

  it('maps a date to the sign of its Persian month', () => {
    expect(signFor(persian(1, 1)).name).toBe('حمل');
    expect(signFor(persian(6, 16)).name).toBe('سنبله');
    expect(signFor(persian(6, 16)).latin).toBe('Virgo');
    expect(signFor(persian(12, 29)).name).toBe('حوت');
  });

  it('states the range as the whole Persian month', () => {
    // Shahrivar has 31 days, Bahman has 30
    expect(signRange(persian(6, 16))).toBe('۱ تا ۳۱ شهریور');
    expect(signRange(persian(11, 2))).toBe('۱ تا ۳۰ بهمن');
  });

  it('reports progress through the sign between 0 and 1', () => {
    expect(signProgress(persian(6, 1))).toBeCloseTo(1 / 31);
    expect(signProgress(persian(6, 31))).toBe(1);
    for (let month = 1; month <= 12; month += 1) {
      const value = signProgress(persian(month, 1));
      expect(value).toBeGreaterThan(0);
      expect(value).toBeLessThanOrEqual(1);
    }
  });

  it('says what the mapping is and is not', () => {
    expect(ZODIAC_NOTICE).toContain('افغانستان');
    expect(ZODIAC_NOTICE).toContain('طالع');
  });
});
