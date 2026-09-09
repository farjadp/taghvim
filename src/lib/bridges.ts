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
import { eventsForDate, hasOfficialLunarDate, type CalendarEvent, type EventGroups } from './events';

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
  // The official holidays inside the run, in order, without duplicate titles. The whole
  // event is kept rather than its title, because the category decides how it is drawn.
  // Fridays contribute nothing here: a weekend has no occasion.
  occasions: CalendarEvent[];
  // True when any holiday in the run is a computed lunar date rather than one pinned to
  // the official calendar, so the run may shift by a day. The UI must say so.
  uncertain: boolean;
};

export type BridgeOptions = {
  // Most leave days a bridge may cost. Above two it stops being a bridge and becomes a holiday.
  maxLeave?: number;
  // Shortest run worth reporting. Three is a normal weekend plus one day; four is news.
  minLength?: number;
  // Fewest days the run must hand over for free — its length minus the leave it costs.
  // Two days off bought with two days of leave is not a bridge, it is a swap.
  minFree?: number;
};

// Shown verbatim beside any bridge list. Preserve it: the run is computed from a curated
// dataset, and a lunar holiday inside it can move by a day.
export const BRIDGES_NOTICE = 'این بازه‌ها از همان فهرست گزیدهٔ مناسبت‌ها محاسبه می‌شوند و تقویم رسمی نیستند. فقط جمعه تعطیل هفتگی حساب شده است؛ پنجشنبه نه. بازه‌ای که روی یک تعطیلی قمری محاسباتی بنشیند ممکن است یک روز جابه‌جا شود.';

type Day = { date: Date; off: boolean; occasions: CalendarEvent[]; uncertain: boolean };

// One day's answer to the only two questions a bridge asks: is it off, and why.
function readDay(date: Date, groups: EventGroups): Day {
  const events = eventsForDate(date, groups);
  const holidays = events.filter((event) => event.holiday);
  // A computed lunar holiday can land a day either side of the official one.
  const uncertain = holidays.some((event) => event.category === 'religious' && !hasOfficialLunarDate(date));
  return {
    date,
    off: weekdayIndex(date) === FRIDAY || holidays.length > 0,
    occasions: holidays,
    uncertain,
  };
}

// A window into the padded day list. `leave` counts the work days inside it.
type Span = { from: number; to: number; leave: number };

// Every window that cannot be widened without spending more than `budget` days of leave.
// Two pointers: `left` is always the earliest day still affordable for the current `right`,
// so each recorded window is already as wide as its budget allows on the left; the guard on
// `right` keeps only the ones that are also as wide as they can be on the right.
function widestSpans(days: Day[], budget: number): Span[] {
  const spans: Span[] = [];
  let left = 0;
  let work = 0;
  for (let right = 0; right < days.length; right += 1) {
    if (!days[right].off) work += 1;
    while (work > budget) {
      if (!days[left].off) work -= 1;
      left += 1;
    }
    const stuck = right === days.length - 1 || (!days[right + 1].off && work === budget);
    if (stuck) spans.push({ from: left, to: right, leave: work });
  }
  return spans;
}

// Bridges overlap by nature: the same holiday can be described as a short free run or a
// longer one bought with leave, and the leave can be taken before it or after it. Of two runs
// that touch the same days, one is simply worse — it costs at least as much and gives no more.
// Dropping those is what turns the arithmetic into a list somebody can read; a cheaper run is
// never dropped for a longer one, so the free long weekends always survive.
function dominated(candidate: Bridge, others: Bridge[]): boolean {
  return others.some((other) => {
    if (other === candidate) return false;
    const overlaps = other.start.getTime() <= candidate.end.getTime()
      && other.end.getTime() >= candidate.start.getTime();
    if (!overlaps || other.leave.length > candidate.leave.length) return false;
    // Same price and same length: keep the earlier one, so the choice is stable rather than
    // dependent on the order the windows happened to be built in.
    return other.length > candidate.length
      || (other.length === candidate.length && other.start.getTime() < candidate.start.getTime());
  });
}

/**
 * Every run of days off between `from` and `to` that is at least `minLength` days long and
 * costs at most `maxLeave` days of leave, in date order.
 *
 * A run may open or close on a leave day — «take Tuesday off and Tuesday to Friday is yours»
 * is the whole point — so the same holiday can appear more than once at different prices.
 * That is deliberate: taking the day before and taking the day after are different choices.
 *
 * The window is padded by a week on both sides before the runs are built, because a run that
 * starts on the last Friday of the previous month is still that long — cutting it at the
 * boundary would report a shorter holiday than the visitor actually gets.
 */
export function findBridges(from: Date, to: Date, groups: EventGroups, options: BridgeOptions = {}): Bridge[] {
  const maxLeave = options.maxLeave ?? 2;
  const minLength = options.minLength ?? 4;
  const minFree = options.minFree ?? 3;
  if (from.getTime() > to.getTime()) throw new RangeError('from must not be after to');
  if (maxLeave < 0 || minLength < 1) throw new RangeError('maxLeave and minLength must be positive');

  const padding = 7;
  const total = daysBetween(from, to) + 2 * padding + 1;
  const days: Day[] = Array.from({ length: total }, (_, index) => readDay(addDays(from, index - padding), groups));

  // The same span comes back from more than one budget; its real cost is the work days in it,
  // so keeping one copy per span loses nothing.
  const spans = new Map<string, Span>();
  for (let budget = 0; budget <= maxLeave; budget += 1) {
    for (const span of widestSpans(days, budget)) {
      if (span.to - span.from + 1 < minLength) continue;
      spans.set(`${span.from}-${span.to}`, span);
    }
  }

  const candidates = [...spans.values()].map((span): Bridge => {
    const run = days.slice(span.from, span.to + 1);
    return {
      start: run[0].date,
      end: run[run.length - 1].date,
      length: run.length,
      leave: run.filter((day) => !day.off).map((day) => day.date),
      occasions: [...new Map(run.flatMap((day) => day.occasions).map((event) => [event.title, event])).values()],
      uncertain: run.some((day) => day.uncertain),
    };
  });

  // Padding exists to measure runs, not to report them: a run entirely outside the asked
  // window is not this window's news.
  const window = { from: dayKey(from), to: dayKey(to) };
  const worthwhile = candidates.filter((bridge) => bridge.length - bridge.leave.length >= minFree);
  return worthwhile
    .filter((bridge) => !dominated(bridge, worthwhile))
    .filter((bridge) => dayKey(bridge.end) >= window.from && dayKey(bridge.start) <= window.to)
    .sort((a, b) => a.start.getTime() - b.start.getTime() || a.leave.length - b.leave.length);
}

/** The first bridge that has not ended yet, or undefined when the window holds none. */
export function nextBridge(bridges: Bridge[], today: Date): Bridge | undefined {
  return bridges.find((bridge) => dayKey(bridge.end) >= dayKey(today));
}
