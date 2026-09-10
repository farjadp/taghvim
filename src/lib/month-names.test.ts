// ============================================================================
// Source: src/lib/month-names.test.ts
// Version: 0.1.0 — 2026-09-10
// Why: The month meanings are only useful if they sit under the right month, so
//      the list is pinned to MONTHS itself rather than trusted to stay in order.
// Env / Deps: Vitest.
// ============================================================================

import { describe, expect, it } from 'vitest';
import { MONTHS } from './calendar';
import { MONTH_NAMES, monthNames, RENAMED } from './month-names';

describe('month names', () => {
  it('lines up with the calendar, name for name and in order', () => {
    expect(MONTH_NAMES.map((month) => month.modern)).toEqual(MONTHS);
  });

  it('gives every month an origin and a meaning', () => {
    for (const month of MONTH_NAMES) {
      expect(month.avestan.length).toBeGreaterThan(1);
      // «آتش» is three letters and is the whole answer for آذر; the bound is a
      // guard against an empty cell, not a demand for a sentence.
      expect(month.meaning.length).toBeGreaterThan(2);
    }
  });

  it('changes exactly the two names that have a different older form', () => {
    expect(RENAMED.map((month) => [month.modern, month.older]))
      .toEqual([['مرداد', 'امرداد'], ['اسفند', 'سپندارمذ']]);
  });

  it('swaps only those two and leaves the other ten alone', () => {
    const modern = monthNames(false);
    const older = monthNames(true);
    expect(modern).toEqual(MONTHS);
    expect(older[4]).toBe('امرداد');
    expect(older[11]).toBe('سپندارمذ');
    const changed = older.filter((name, index) => name !== modern[index]);
    expect(changed).toHaveLength(2);
  });
});
