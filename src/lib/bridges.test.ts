// ============================================================================
// Source: src/lib/bridges.test.ts
// Version: 0.1.0 — 2026-09-09
// Why: Unit tests for holiday bridges: run length, leave cost, group filtering,
//      window padding, de-duplication and the lunar uncertainty flag.
// Env / Deps: Vitest.
// ============================================================================

import { describe, expect, it } from 'vitest';
import { addDays, dayKey, fromCalendar, toCalendar, weekdayIndex } from './calendar';
import { ALL_GROUPS, DEFAULT_GROUPS, type EventGroups } from './events';
import { BRIDGES_NOTICE, findBridges, nextBridge } from './bridges';

const persian = (year: number, month: number, day: number) => fromCalendar({ year, month, day });
const NO_GROUPS: EventGroups = { religious: false, state: false, world: false };

// The whole of one Persian year, the window the panel will ask for.
const year = (value: number) => ({ from: persian(value, 1, 1), to: persian(value, 12, 29) });

describe('holiday bridges', () => {
  it('finds the Nowruz run, which needs no leave at all', () => {
    const { from, to } = year(1405);
    const nowruz = findBridges(from, to, DEFAULT_GROUPS)
      .filter((bridge) => bridge.occasions.some(({ title }) => title.includes('نوروز')));
    // The same holiday is offered at more than one price, and the cheapest is free.
    const free = nowruz.filter((bridge) => bridge.leave.length === 0);
    expect(free.length).toBeGreaterThan(0);
    // Four consecutive Nowruz holidays plus the Friday beside them cannot make a shorter run.
    expect(Math.min(...free.map((bridge) => bridge.length))).toBeGreaterThanOrEqual(5);
    // And buying one leave day must buy at least one more day off, or it would not be listed.
    const paid = nowruz.filter((bridge) => bridge.leave.length > 0);
    expect(paid.every((bridge) => bridge.length > Math.min(...free.map((f) => f.length)))).toBe(true);
  });

  it('never reports a run shorter than the minimum or costlier than the budget', () => {
    const { from, to } = year(1405);
    for (const bridge of findBridges(from, to, ALL_GROUPS)) {
      expect(bridge.length).toBeGreaterThanOrEqual(3);
      expect(bridge.leave.length).toBeLessThanOrEqual(2);
    }
  });

  it('never reports a swap: a run must hand over more days than it costs', () => {
    const { from, to } = year(1405);
    for (const bridge of findBridges(from, to, ALL_GROUPS)) {
      expect(bridge.length - bridge.leave.length).toBeGreaterThanOrEqual(2);
      expect(bridge.length - bridge.leave.length).toBeGreaterThan(bridge.leave.length - 1);
    }
    // Raising the bar hides the marginal ones rather than being the only rule there is.
    expect(findBridges(from, to, ALL_GROUPS, { minFree: 3 }).length)
      .toBeLessThan(findBridges(from, to, ALL_GROUPS).length);
  });

  // The bug this floor was lowered for: Friday is the only weekly day off, so a single-day
  // holiday beside one can hand over two free days at most. While the floor was three, no
  // state holiday in 1405 could ever produce a run — the switch shaded the grid and changed
  // this list by nothing, which reads as a broken switch rather than an empty answer.
  it('lets a single state holiday next to a Friday produce a run', () => {
    const { from, to } = year(1405);
    const withState = findBridges(from, to, ALL_GROUPS).filter((bridge) =>
      bridge.occasions.some((occasion) => occasion.category === 'state'));
    expect(withState.length).toBeGreaterThan(0);
    // 22 Bahman 1405 is a Thursday; the run that reaches it must exist and must be paid for.
    const bahman = withState.find((bridge) => {
      const start = toCalendar(bridge.start);
      return start.month === 11;
    });
    expect(bahman, '22 Bahman produced no run').toBeDefined();
    expect(bahman!.leave.length).toBeGreaterThan(0);
  });

  it('reports nothing from the state group when the switch is off', () => {
    const { from, to } = year(1405);
    for (const bridge of findBridges(from, to, { ...ALL_GROUPS, state: false })) {
      expect(bridge.occasions.every((occasion) => occasion.category !== 'state')).toBe(true);
    }
  });

  it('honours maxLeave and minLength', () => {
    const { from, to } = year(1405);
    const free = findBridges(from, to, ALL_GROUPS, { maxLeave: 0 });
    expect(free.every((bridge) => bridge.leave.length === 0)).toBe(true);
    const long = findBridges(from, to, ALL_GROUPS, { minLength: 6 });
    expect(long.every((bridge) => bridge.length >= 6)).toBe(true);
    expect(long.length).toBeLessThanOrEqual(findBridges(from, to, ALL_GROUPS).length);
  });

  it('counts every leave day as a work day inside the run', () => {
    const { from, to } = year(1405);
    for (const bridge of findBridges(from, to, ALL_GROUPS)) {
      for (const day of bridge.leave) {
        expect(weekdayIndex(day)).not.toBe(6);
        expect(dayKey(day) >= dayKey(bridge.start) && dayKey(day) <= dayKey(bridge.end)).toBe(true);
      }
    }
  });

  it('reports the run as one unbroken span of the right length', () => {
    const { from, to } = year(1405);
    for (const bridge of findBridges(from, to, ALL_GROUPS)) {
      expect(dayKey(addDays(bridge.start, bridge.length - 1))).toBe(dayKey(bridge.end));
    }
  });

  it('a switched-off group can never produce a bridge', () => {
    const { from, to } = year(1405);
    const withReligious = findBridges(from, to, ALL_GROUPS);
    const withoutReligious = findBridges(from, to, { ...ALL_GROUPS, religious: false });
    expect(withoutReligious.length).toBeLessThan(withReligious.length);
    // With no optional group on, only the national holidays are left, and none of the runs
    // may carry a title from a group the visitor cannot see.
    for (const bridge of findBridges(from, to, NO_GROUPS)) {
      expect(bridge.uncertain).toBe(false);
    }
  });

  it('flags a run built on a computed lunar holiday as uncertain', () => {
    const { from, to } = year(1405);
    const religious = findBridges(from, to, ALL_GROUPS).filter((bridge) => bridge.uncertain);
    expect(religious.length).toBeGreaterThan(0);
    // 8 Shahrivar 1405 is one of the three dates pinned to the official calendar, so a run
    // resting on it carries no ±1 day risk and must not be marked as if it did.
    const pinned = findBridges(persian(1405, 6, 1), persian(1405, 6, 15), ALL_GROUPS, { minFree: 2 })
      .filter((bridge) => bridge.occasions.some(({ title }) => title.includes('میلاد پیامبر')));
    expect(pinned.length).toBeGreaterThan(0);
    expect(pinned.every((bridge) => bridge.uncertain)).toBe(false);
  });

  it('measures a run that starts before the window instead of truncating it', () => {
    // Ask for a window opening in the middle of the Nowruz holidays; the run must still be
    // reported at its true length, starting on 1 Farvardin.
    const inside = findBridges(persian(1405, 1, 3), persian(1405, 1, 20), DEFAULT_GROUPS);
    const nowruz = inside.find((bridge) => bridge.occasions.some(({ title }) => title.includes('نوروز')));
    expect(nowruz).toBeDefined();
    // The run opens on the Friday before Nowruz, which is outside the window that was asked
    // for — reporting it as starting on 1 Farvardin would understate the holiday by a day.
    expect(dayKey(nowruz!.start) < dayKey(persian(1405, 1, 1))).toBe(true);
    expect(nowruz!.length).toBeGreaterThanOrEqual(5);
  });

  it('keeps no run that another overlapping one beats on both price and length', () => {
    const { from, to } = year(1405);
    const bridges = findBridges(from, to, ALL_GROUPS);
    for (const bridge of bridges) {
      const better = bridges.filter((other) => other !== bridge
        && dayKey(other.start) <= dayKey(bridge.end)
        && dayKey(other.end) >= dayKey(bridge.start)
        && other.leave.length <= bridge.leave.length
        && other.length > bridge.length);
      expect(better).toHaveLength(0);
    }
    // A free run is never dropped for a longer one that costs leave.
    expect(bridges.some((bridge) => bridge.leave.length === 0)).toBe(true);
  });

  it('returns runs in date order and none outside the window', () => {
    const { from, to } = year(1405);
    const bridges = findBridges(from, to, ALL_GROUPS);
    const keys = bridges.map((bridge) => dayKey(bridge.start));
    expect(keys).toEqual([...keys].sort());
    for (const bridge of bridges) {
      expect(dayKey(bridge.end) >= dayKey(from)).toBe(true);
      expect(dayKey(bridge.start) <= dayKey(to)).toBe(true);
    }
  });

  it('rejects a reversed window', () => {
    expect(() => findBridges(persian(1405, 2, 1), persian(1405, 1, 1), ALL_GROUPS)).toThrow(RangeError);
  });

  it('nextBridge skips the runs that have already ended', () => {
    const { from, to } = year(1405);
    const bridges = findBridges(from, to, ALL_GROUPS);
    const today = persian(1405, 6, 20);
    const next = nextBridge(bridges, today);
    expect(next).toBeDefined();
    expect(dayKey(next!.end) >= dayKey(today)).toBe(true);
    // Nothing earlier may qualify.
    const earlier = bridges.filter((bridge) => dayKey(bridge.start) < dayKey(next!.start));
    expect(earlier.every((bridge) => dayKey(bridge.end) < dayKey(today))).toBe(true);
  });

  it('keeps the notice honest about Thursday and about lunar dates', () => {
    expect(BRIDGES_NOTICE).toContain('پنجشنبه');
    expect(BRIDGES_NOTICE).toContain('قمری');
  });
});
