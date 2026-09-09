// ============================================================================
// Source: src/lib/day-card.test.ts
// Version: 0.1.0 — 2026-09-09
// Why: Unit tests for the day card's content: it follows the visitor's groups,
//      caps the occasion list, and names its file so the name travels.
// Env / Deps: Vitest. Nothing here touches a canvas.
// ============================================================================

import { describe, expect, it } from 'vitest';
import { fromCalendar } from './calendar';
import { ALL_GROUPS, DEFAULT_GROUPS } from './events';
import { cardFilename, cardOccasions, dayCard, MAX_OCCASIONS } from './day-card';

const persian = (year: number, month: number, day: number) => fromCalendar({ year, month, day });

describe('the day card', () => {
  it('carries the day in all three calendars', () => {
    const card = dayCard(persian(1405, 6, 18), DEFAULT_GROUPS);
    expect(card).toMatchObject({ weekday: 'چهارشنبه', day: '۱۸', month: 'شهریور', year: '۱۴۰۵' });
    // Gregorian keeps Latin digits, as everywhere else in the app.
    expect(card.gregorian).toBe('2026-09-09');
    expect(card.islamic).toContain('۱۴۴۸');
  });

  it('shows only the occasions the visitor has switched on', () => {
    const off = dayCard(persian(1405, 11, 22), DEFAULT_GROUPS);
    const on = dayCard(persian(1405, 11, 22), { ...DEFAULT_GROUPS, state: true });
    expect(off.occasions).toHaveLength(0);
    expect(off.holiday).toBe(false);
    expect(on.occasions.some((event) => event.title.includes('شورش ۵۷'))).toBe(true);
    expect(on.holiday).toBe(true);
  });

  it('caps the list and counts what it left out', () => {
    const card = dayCard(persian(1405, 1, 1), ALL_GROUPS);
    const { lines, hidden } = cardOccasions(card, 1);
    expect(lines).toHaveLength(1);
    expect(hidden).toBe(card.occasions.length - 1);
    // The default cap never returns more than it promises.
    expect(cardOccasions(card).lines.length).toBeLessThanOrEqual(MAX_OCCASIONS);
  });

  it('reports nothing hidden when everything fits', () => {
    const { lines, hidden } = cardOccasions(dayCard(persian(1405, 6, 19), DEFAULT_GROUPS));
    expect(hidden).toBe(0);
    expect(lines.length).toBeLessThanOrEqual(MAX_OCCASIONS);
  });

  it('names the file so it sorts by date and survives being sent on', () => {
    expect(cardFilename(persian(1405, 6, 18))).toBe('taghvim-1405-06-18.png');
    expect(cardFilename(persian(1405, 12, 9))).toBe('taghvim-1405-12-09.png');
    // ASCII only: Persian digits in a filename do not survive every hop.
    expect(cardFilename(persian(1405, 1, 1))).toMatch(/^[\x20-\x7e]+$/);
  });
});
