// ============================================================================
// Source: src/lib/tahvil.test.ts
// Version: 0.1.0 — 2026-09-10
// Why: The moment the year turns is compared to the second by this audience, so
//      both halves are pinned: the official figures come back exactly, and the
//      computed ones land within the minute they are allowed to claim.
// Env / Deps: Vitest; jalaali-js as the independent check on the noon rule.
// ============================================================================

import { toGregorian } from 'jalaali-js';
import { describe, expect, it } from 'vitest';
import { fromCalendar, toCalendar } from './calendar';
import { computeMarchEquinox, nextTahvil, seasonalTahvil, tahvilFor, tehranClock, turnsBeforeNoon } from './tahvil';

// The Geophysics Calendar Centre's announcements, on the Tehran clock.
const ANNOUNCED = [
  { year: 1403, clock: [6, 36, 26], utc: '2024-03-20T03:06:26Z' },
  { year: 1404, clock: [12, 31, 30], utc: '2025-03-20T09:01:30Z' },
  { year: 1405, clock: [18, 15, 59], utc: '2026-03-20T14:45:59Z' },
] as const;

describe('the official moments', () => {
  it('come back exactly as announced, to the second', () => {
    for (const { year, clock, utc } of ANNOUNCED) {
      const tahvil = tahvilFor(year);
      expect(tahvil.source).toBe('official');
      expect(tahvil.precision).toBe('second');
      expect(tahvil.instant.toISOString()).toBe(new Date(utc).toISOString());
      const { hour, minute, second } = tehranClock(tahvil.instant);
      expect([hour, minute, second]).toEqual([...clock]);
    }
  });

  it('keeps 1406 to the minute, because its seconds were never published', () => {
    const tahvil = tahvilFor(1406);
    expect(tahvil.source).toBe('official');
    expect(tahvil.precision).toBe('minute');
    const { hour, minute } = tehranClock(tahvil.instant);
    expect([hour, minute]).toEqual([23, 54]);
  });
});

describe('the computed moment', () => {
  it('lands within a minute of every official figure', () => {
    for (const year of [1403, 1404, 1405, 1406]) {
      const official = tahvilFor(year).instant.getTime();
      const computed = computeMarchEquinox(year + 621).getTime();
      expect(Math.abs(computed - official) / 1000, `${year}`).toBeLessThan(60);
    }
  });

  it('is used past the last official year, and claims only the minute', () => {
    const tahvil = tahvilFor(1410);
    expect(tahvil.source).toBe('computed');
    expect(tahvil.precision).toBe('minute');
  });
});

describe('the noon rule', () => {
  // Before noon on the Tehran clock the turning day is itself 1 Farvardin; from noon
  // on, 1 Farvardin is the next day. jalaali-js computes 1 Farvardin by its own
  // arithmetic, so agreement here is an independent check on both.
  it('gives the same 1 Farvardin as the calendar, for every pinned year', () => {
    for (const year of [1403, 1404, 1405, 1406]) {
      const instant = tahvilFor(year).instant;
      const shifted = new Date(instant.getTime() + 3.5 * 3_600_000);
      const turningDay = Date.UTC(shifted.getUTCFullYear(), shifted.getUTCMonth(), shifted.getUTCDate());
      const nowruz = turnsBeforeNoon(instant) ? turningDay : turningDay + 86_400_000;
      const { gy, gm, gd } = toGregorian(year, 1, 1);
      expect(nowruz, `${year}`).toBe(Date.UTC(gy, gm - 1, gd));
    }
  });
});

describe('the next turn', () => {
  it('is 1406 from today, and steps past a turn that has just happened', () => {
    expect(nextTahvil(new Date('2026-09-10T12:00:00Z'), 1405).year).toBe(1406);
    // A second after 1406 turned, while the calendar still reads 29 Esfand 1405
    expect(nextTahvil(new Date('2027-03-20T20:24:01Z'), 1405).year).toBe(1407);
  });
});

describe('the season it shows in', () => {
  const at = (date: Date) => seasonalTahvil(date, toCalendar(date));

  it('stays out of the rest of the year, Bahman included', () => {
    expect(at(new Date('2026-09-10T12:00:00Z'))).toBeNull();
    expect(at(fromCalendar({ year: 1405, month: 11, day: 30 }))).toBeNull();
  });

  it('appears on 1 Esfand, pointing at the coming year', () => {
    expect(at(fromCalendar({ year: 1405, month: 12, day: 1 }))?.year).toBe(1406);
  });

  it('holds until the instant and is gone the moment after, still on 29 Esfand', () => {
    const turn = tahvilFor(1406).instant.getTime();
    expect(at(new Date(turn - 60_000))?.year).toBe(1406);
    const after = new Date(turn + 60_000);
    // 23:55 on the Tehran clock is still 29 Esfand 1405 by the calendar's own count
    expect(toCalendar(after)).toMatchObject({ year: 1405, month: 12, day: 29 });
    expect(at(after)).toBeNull();
  });
});
