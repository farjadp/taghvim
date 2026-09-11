// ============================================================================
// Source: src/lib/countdown.test.ts
// Version: 0.1.0 — 2026-09-09
// Why: Unit tests for the day countdowns: anchors roll over, holidays follow
//      the visitor's groups, one entry per day, and the notice stays honest.
// Env / Deps: Vitest.
// ============================================================================

import { describe, expect, it } from 'vitest';
import { dayKey, fromCalendar } from './calendar';
import { ALL_GROUPS, DEFAULT_GROUPS } from './events';
import { COUNTDOWN_NOTICE, nextAnchors, nextHolidays } from './countdown';

const persian = (year: number, month: number, day: number) => fromCalendar({ year, month, day });

describe('anchors', () => {
  it('counts to the coming Nowruz and Yalda, nearest first', () => {
    const [first, second] = nextAnchors(persian(1405, 6, 18));
    expect(first.occasions.map((item) => item.title)).toEqual(['شب یلدا']);
    expect(dayKey(first.date)).toBe(dayKey(persian(1405, 9, 30)));
    expect(second.occasions.map((item) => item.title)).toEqual(['نوروز']);
    expect(dayKey(second.date)).toBe(dayKey(persian(1406, 1, 1)));
    expect(first.days).toBeLessThan(second.days);
  });

  it('reports zero on the day itself and rolls over the day after', () => {
    expect(nextAnchors(persian(1405, 1, 1)).find((item) => item.occasions[0].title === 'نوروز')!.days).toBe(0);
    const after = nextAnchors(persian(1405, 1, 2)).find((item) => item.occasions[0].title === 'نوروز')!;
    expect(dayKey(after.date)).toBe(dayKey(persian(1406, 1, 1)));
    // 1405 has 365 days, so the day after Nowruz is 364 days from the next one.
    expect(after.days).toBe(364);
  });
});

describe('next holidays', () => {
  it('starts tomorrow, never today, and gives one entry per day', () => {
    const list = nextHolidays(persian(1405, 1, 1), ALL_GROUPS, 5);
    expect(list[0].days).toBeGreaterThanOrEqual(1);
    const keys = list.map((item) => dayKey(item.date));
    expect(new Set(keys).size).toBe(keys.length);
    expect(list.map((item) => item.days)).toEqual([...list.map((item) => item.days)].sort((a, b) => a - b));
  });

  it('follows the visitor\'s groups: the default visitor sees no religious holiday', () => {
    // Five, not three: since 22 Aban was pinned on 10 Sep, the first three religious
    // holidays from here — Fatima, Ali, Mab'ath — are all official dates, and the first
    // computed (uncertain) one is 15 Sha'ban on 4 Bahman, fourth in line.
    const all = nextHolidays(persian(1405, 6, 18), ALL_GROUPS, 5);
    const defaults = nextHolidays(persian(1405, 6, 18), DEFAULT_GROUPS, 3);
    expect(all.some((item) => item.uncertain)).toBe(true);
    expect(defaults.every((item) => !item.uncertain)).toBe(true);
    // From Shahrivar with the default groups, the next holiday is the oil-nationalisation day.
    expect(defaults[0].occasions[0].title).toContain('نفت');
  });

  it('merges two holidays on one day into one entry', () => {
    // 14 Khordad 1405: a state occasion and, with religious on, Eid al-Ghadir on the same day.
    const [next] = nextHolidays(persian(1405, 3, 13), ALL_GROUPS, 1);
    expect(next.days).toBe(1);
    expect(next.occasions.length).toBeGreaterThanOrEqual(2);
  });

  it('respects the limit and the horizon', () => {
    expect(nextHolidays(persian(1405, 6, 18), ALL_GROUPS, 2)).toHaveLength(2);
    expect(nextHolidays(persian(1405, 6, 18), DEFAULT_GROUPS, 3, 10)).toHaveLength(0);
  });

  it('keeps the notice honest about the instant and the lunar dates', () => {
    expect(COUNTDOWN_NOTICE).toContain('لحظه');
    expect(COUNTDOWN_NOTICE).toContain('قمری');
  });
});
