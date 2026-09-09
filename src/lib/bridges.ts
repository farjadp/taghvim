// ============================================================================
// Source: src/lib/bridges.ts
// Version: 0.1.0 — 2026-09-09
// Why: Holiday bridges — the runs of days off you can reach by taking one or two
//      work days as leave, plus the long weekends that need no leave at all.
// Env / Deps: Reads days off through eventsForDate(date, groups), so a group the
//      visitor has switched off can never produce a bridge they cannot see.
//      No storage, no network; safe in the extension bundle.
// ============================================================================

import { addDays, dayKey, daysBetween, weekdayIndex } from './calendar';
import { eventsForDate, hasOfficialLunarDate, type EventGroups } from './events';

// Friday is the Iranian weekend. Thursday is not: it is a half day for some employers
// and a full one for others, so treating it as off would invent bridges that do not exist.
const FRIDAY = 6;

// A run of consecutive days off, and what it costs to get it.
export type Bridge = {
  start: Date;
  end: Date;
  // Total days in the run, leave days included.
  length: number;
  // The work days inside the run that have to be taken as leave. Empty means it is free.
  leave: Date[];
  // Titles of the official holidays inside the run, in order, without duplicates.
  // Fridays contribute nothing here: a weekend has no title.
  titles: string[];
  // True when any holiday in the run is a computed lunar date rather than one pinned to
  // the official calendar, so the run may shift by a day. The UI must say so.
  uncertain: boolean;
};

export type BridgeOptions = {
  // Most leave days a bridge may cost. Above two it stops being a bridge and becomes a holiday.
  maxLeave?: number;
  // Shortest run worth reporting. Three is a normal weekend plus one day; four is news.
  minLength?: number;
};

// Shown verbatim beside any bridge list. Preserve it: the run is computed from a curated
// dataset, and a lunar holiday inside it can move by a day.
export const BRIDGES_NOTICE = 'پل‌ها از همان فهرست گزیدهٔ مناسبت‌ها محاسبه می‌شوند و تقویم رسمی نیستند. فقط جمعه تعطیل هفتگی حساب شده است؛ پنجشنبه نه. هر پلی که روی یک تعطیلی قمری محاسباتی بنشیند ممکن است یک روز جابه‌جا شود.';

type Day = { date: Date; off: boolean; titles: string[]; uncertain: boolean };

// One day's answer to the only two questions a bridge asks: is it off, and why.
function readDay(date: Date, groups: EventGroups): Day {
  const events = eventsForDate(date, groups);
  const holidays = events.filter((event) => event.holiday);
  // A computed lunar holiday can land a day either side of the official one.
  const uncertain = holidays.some((event) => event.category === 'religious' && !hasOfficialLunarDate(date));
  return {
    date,
    off: weekdayIndex(date) === FRIDAY || holidays.length > 0,
    titles: holidays.map((event) => event.title),
    uncertain,
  };
}

// A maximal run of days off, as indices into the padded day list.
type Anchor = { from: number; to: number };

function anchorsOf(days: Day[]): Anchor[] {
  const anchors: Anchor[] = [];
  for (let index = 0; index < days.length; index += 1) {
    if (!days[index].off) continue;
    const from = index;
    while (index + 1 < days.length && days[index + 1].off) index += 1;
    anchors.push({ from, to: index });
  }
  return anchors;
}

// Bridges overlap by nature: the same four days can be described as one run or as two.
// A candidate is dropped when another one covers it and costs no more leave — that is the
// same holiday said twice, and a list that says it twice is a worse list.
function dominated(candidate: Bridge, others: Bridge[]): boolean {
  return others.some((other) =>
    other !== candidate
    && other.leave.length <= candidate.leave.length
    && other.start.getTime() <= candidate.start.getTime()
    && other.end.getTime() >= candidate.end.getTime()
    && other.length > candidate.length);
}

/**
 * Every run of days off between `from` and `to` that is at least `minLength` days long and
 * costs at most `maxLeave` days of leave, newest last.
 *
 * The window is padded by a week on both sides before the runs are built, because a run that
 * starts on the last Friday of the previous month is still that long — cutting it at the
 * boundary would report a shorter holiday than the visitor actually gets.
 */
export function findBridges(from: Date, to: Date, groups: EventGroups, options: BridgeOptions = {}): Bridge[] {
  const maxLeave = options.maxLeave ?? 2;
  const minLength = options.minLength ?? 4;
  if (from.getTime() > to.getTime()) throw new RangeError('from must not be after to');
  if (maxLeave < 0 || minLength < 1) throw new RangeError('maxLeave and minLength must be positive');

  const padding = 7;
  const total = daysBetween(from, to) + 2 * padding + 1;
  const days: Day[] = Array.from({ length: total }, (_, index) => readDay(addDays(from, index - padding), groups));

  const anchors = anchorsOf(days);
  const candidates: Bridge[] = [];
  for (let start = 0; start < anchors.length; start += 1) {
    let leave = 0;
    for (let end = start; end < anchors.length; end += 1) {
      // Cost of reaching this anchor from the previous one: the work days between them.
      if (end > start) leave += anchors[end].from - anchors[end - 1].to - 1;
      if (leave > maxLeave) break;
      const span = days.slice(anchors[start].from, anchors[end].to + 1);
      if (span.length < minLength) continue;
      candidates.push({
        start: span[0].date,
        end: span[span.length - 1].date,
        length: span.length,
        leave: span.filter((day) => !day.off).map((day) => day.date),
        titles: [...new Set(span.flatMap((day) => day.titles))],
        uncertain: span.some((day) => day.uncertain),
      });
    }
  }

  // Padding exists to measure runs, not to report them: a run entirely outside the asked
  // window is not this window's news.
  const window = { from: dayKey(from), to: dayKey(to) };
  return candidates
    .filter((bridge) => !dominated(bridge, candidates))
    .filter((bridge) => dayKey(bridge.end) >= window.from && dayKey(bridge.start) <= window.to)
    .sort((a, b) => a.start.getTime() - b.start.getTime());
}

/** The first bridge that has not ended yet, or undefined when the window holds none. */
export function nextBridge(bridges: Bridge[], today: Date): Bridge | undefined {
  return bridges.find((bridge) => dayKey(bridge.end) >= dayKey(today));
}
