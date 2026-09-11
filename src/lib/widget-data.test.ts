// ============================================================================
// Source: src/lib/widget-data.test.ts
// Version: 0.1.0 — 2026-09-10
// Why: The widget shows what the site shows, or it is lying in two places. These
//      hold the committed data files to the code that writes them and hold the
//      widget's filter to eventsForDate on every day, for every set of groups.
// Env / Deps: Reads mobile/shared/*.json from disk.
// ============================================================================

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { addDays, fromCalendar, monthLength, toCalendar } from './calendar';
import { eventsForDate, type EventGroups } from './events';
import {
  buildJalaliVectors,
  buildWidgetData,
  visibleWidgetEvents,
  WIDGET_DATA_VERSION,
  WIDGET_YEARS,
  type WidgetData,
} from './widget-data';

const shared = (name: string) => JSON.parse(readFileSync(join(process.cwd(), 'mobile/shared', name), 'utf8'));
const data = buildWidgetData();

const COMBINATIONS: EventGroups[] = [false, true].flatMap((religious) =>
  [false, true].flatMap((state) => [false, true].map((world) => ({ religious, state, world }))),
);

describe('widget data', () => {
  it('is committed exactly as the code would write it — run npm run build:widget-data', () => {
    expect(shared('widget-data.json')).toEqual(data);
    expect(shared('jalali-vectors.json')).toEqual(buildJalaliVectors());
  });

  it('filters to exactly what eventsForDate shows, for every group combination on every day', () => {
    const end = fromCalendar({ year: WIDGET_YEARS.to + 1, month: 1, day: 1 });
    let checked = 0;
    for (let date = fromCalendar({ year: WIDGET_YEARS.from, month: 1, day: 1 }); date < end; date = addDays(date, 1)) {
      const { year, month, day } = toCalendar(date);
      const rows = data.days[`${year}-${month}-${day}`] ?? [];
      for (const groups of COMBINATIONS) {
        const expected = eventsForDate(date, groups).map((event) => [event.title, event.category, event.holiday ? 1 : 0]);
        const actual = visibleWidgetEvents(rows, groups).map(([title, category, holiday]) => [title, category, holiday]);
        expect(actual).toEqual(expected);
      }
      checked += 1;
    }
    // Every day of the window, leap years included, and no day twice.
    let expectedDays = 0;
    for (let year = WIDGET_YEARS.from; year <= WIDGET_YEARS.to; year += 1) expectedDays += 336 + monthLength(year, 12);
    expect(checked).toBe(expectedDays);
  });

  it('still reaches the year after this one — move WIDGET_YEARS when this fails', () => {
    expect(WIDGET_YEARS.to).toBeGreaterThanOrEqual(toCalendar(new Date()).year + 1);
  });

  it('marks only computed lunar holidays as uncertain', () => {
    const rows = Object.values(data.days).flat();
    expect(rows.filter(([, category, , uncertain]) => uncertain === 1 && category !== 'religious')).toEqual([]);
    // The three 1405 dates pinned to the official calendar carry no doubt.
    for (const key of ['1405-6-8', '1405-10-2', '1405-10-16']) {
      const religious = data.days[key].filter(([, category]) => category === 'religious');
      expect(religious.length).toBe(1);
      expect(religious[0][3]).toBe(0);
    }
  });

  it('carries the names the widget prints and a version it can refuse', () => {
    const file: WidgetData = data;
    expect(file.version).toBe(WIDGET_DATA_VERSION);
    expect(file.months).toHaveLength(12);
    expect(file.monthsOlder[4]).toBe('امرداد');
    expect(file.weekdays[0]).toBe('شنبه');
    expect(() => buildWidgetData(1407, 1405)).toThrow(RangeError);
  });

  it('has vectors that agree with themselves: consecutive days and Nowruz on 1 Farvardin', () => {
    const vectors = buildJalaliVectors();
    expect(vectors.days[0]).toEqual([1395, 1, 1]);
    expect(vectors.nowruz['1395']).toBe(vectors.start);
    expect(vectors.nowruz['1406']).toBe('2027-03-21');
    expect(Object.keys(vectors.nowruz)).toHaveLength(401);
  });
});
