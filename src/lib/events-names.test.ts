// ============================================================================
// Source: src/lib/events-names.test.ts
// Version: 0.1.0 — 2026-09-11
// Why: Two edits of 10 Sep, pinned by the day a visitor would see them: the two
//      men named plainly, and Fatima on the official 22 Aban rather than the
//      computed 23. Its own file so it touches nothing a parallel branch is editing.
// Env / Deps: Vitest; lib/events through eventsForDate, as the site calls it.
// ============================================================================

import { describe, expect, it } from 'vitest';
import { fromCalendar } from './calendar';
import { ALL_GROUPS, eventsForDate, hasOfficialLunarDate } from './events';

const titlesOn = (year: number, month: number, day: number) =>
  eventsForDate(fromCalendar({ year, month, day }), ALL_GROUPS).map((event) => event.title);

describe('the two men, by name only', () => {
  it('names Khomeini and Khamenei with no prefix, suffix or description', () => {
    expect(titlesOn(1405, 3, 14)).toContain('رحلت خمینی');
    expect(titlesOn(1405, 11, 12)).toContain('بازگشت خمینی؛ آغاز دهه فجر');
    expect(titlesOn(1405, 12, 9)).toContain('هلاکت خامنه‌ای');
  });
});

describe('Fatima in 1405', () => {
  it('falls on 22 Aban, the official date, and no longer on the computed 23', () => {
    expect(titlesOn(1405, 8, 22)).toContain('شهادت حضرت فاطمه (س)');
    expect(titlesOn(1405, 8, 23)).not.toContain('شهادت حضرت فاطمه (س)');
    // Pinned, so the holiday bridges can plan around it without a ±1 day caveat
    expect(hasOfficialLunarDate(fromCalendar({ year: 1405, month: 8, day: 22 }))).toBe(true);
  });
});
