// ============================================================================
// Source: src/lib/dates.ts
// Version: 0.2.0 — 2026-09-10
// Why: The visitor's own dates — birthdays, instalments, appointments, the lot:
//      stored in their browser,
//      never sent anywhere, and exportable as an .ics so their own calendar
//      does the reminding — this app has no server to remind them from.
// Env / Deps: Persists `taghvim-dates` in localStorage, guarded the way
//      lib/view.ts guards its record. Reuses lib/ics.ts for the export.
//      This is the first thing the app stores that is CONTENT, not a setting:
//      /about#privacy has to say so.
// ============================================================================

import { fromCalendar, monthLength, toCalendar } from './calendar';
import { escapeText, foldLine } from './ics';
import { categoryOf, isCategoryId, isRepeat, type CategoryId, type Repeat } from './date-categories';

export type Anniversary = {
  id: string;
  title: string;
  // What kind of thing this is: drives the icon, the colour and the age sentence.
  category: CategoryId;
  // How often it comes round. Each rhythm needs different fields, which is why
  // `month` and `year` are nullable and `validateDraft` decides per rhythm:
  //   yearly  — month and day; year optional, plenty of people know the day only
  //   monthly — day only; a monthly thing has no month and no year
  //   once    — year, month and day, all of them: one date, once
  repeat: Repeat;
  month: number | null;
  day: number;
  year: number | null;
};

export const DATES_KEY = 'taghvim-dates';

// Bounded so one corrupt or runaway write cannot make the page unrenderable, and so the
// stored blob stays small enough to never threaten the storage quota.
export const MAX_DATES = 60;
export const MAX_TITLE = 60;

// Shown wherever this feature is. Preserve it: it is the honest version of «nothing is stored».
export const DATES_NOTICE = 'این فهرست فقط در حافظهٔ همین مرورگر و همین دستگاه ذخیره می‌شود. به هیچ سروری فرستاده نمی‌شود، بین دستگاه‌هایت همگام نمی‌شود، و با پاک کردن دادهٔ سایت از بین می‌رود. برای اینکه یادآوری واقعی بگیری، خروجی را به تقویم خودت اضافه کن.';

export const INVALID_DATE = 'تاریخ معتبر نیست. روز و ماه را بررسی کن؛ سال اختیاری است و اگر نوشتی باید بین ۱۲۰۰ تا ۱۶۰۰ خورشیدی باشد.';
export const INVALID_TITLE = 'یک عنوان بنویس — مثلاً «تولد مریم».';
export const TOO_MANY = `بیشتر از ${MAX_DATES} مورد ذخیره نمی‌شود.`;
export const MONTHLY_DAY = 'برای چیزی که هر ماه تکرار می‌شود فقط روز لازم است — عددی بین ۱ تا ۳۱.';
export const ONCE_NEEDS_YEAR = 'برای یک تاریخ یک‌باره، سال هم لازم است.';

type StorageGetter = () => Storage;

function isAnniversary(value: unknown): value is Anniversary {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
  const record = value as Record<string, unknown>;
  const monthOk = record.month === null
    || (typeof record.month === 'number' && Number.isInteger(record.month) && record.month >= 1 && record.month <= 12);
  const yearOk = record.year === null
    || (typeof record.year === 'number' && Number.isInteger(record.year) && record.year >= 1200 && record.year <= 1600);
  return typeof record.id === 'string' && record.id.length > 0
    && typeof record.title === 'string' && record.title.length > 0 && record.title.length <= MAX_TITLE
    && isCategoryId(record.category) && isRepeat(record.repeat)
    && monthOk && yearOk
    && typeof record.day === 'number' && Number.isInteger(record.day) && record.day >= 1 && record.day <= 31
    && (record.repeat !== 'monthly' || record.month === null)
    && (record.repeat !== 'once' || (record.month !== null && record.year !== null))
    && (record.repeat !== 'yearly' || record.month !== null);
}

/**
 * A row written before 0.9.25, when the only shape was a yearly `kind` of
 * 'birthday' or 'anniversary'. Migrated rather than discarded: these are names
 * and dates someone typed, and 'anniversary' keeps its own category rather than
 * being guessed into «عاشقانه‌ها» — a work anniversary is not a romance.
 */
function migrateLegacy(value: unknown): Anniversary | null {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  if (record.kind !== 'birthday' && record.kind !== 'anniversary') return null;
  if (typeof record.id !== 'string' || typeof record.title !== 'string') return null;
  if (typeof record.month !== 'number' || typeof record.day !== 'number') return null;
  const year = typeof record.year === 'number' ? record.year : null;
  return {
    id: record.id,
    title: record.title.slice(0, MAX_TITLE),
    category: record.kind === 'birthday' ? 'birthday' : 'anniversary',
    repeat: 'yearly',
    month: record.month,
    day: record.day,
    year,
  };
}

/**
 * The stored list, or an empty one. A blob that is not an array is discarded whole; a single
 * malformed entry inside a good array is skipped and the rest are kept, because losing one
 * name is better than losing all of them.
 */
export function readDates(getStorage?: StorageGetter): Anniversary[] {
  try {
    const storage = getStorage ? getStorage() : window.localStorage;
    const raw = storage.getItem(DATES_KEY);
    if (raw === null) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const rows: Anniversary[] = [];
    for (const value of parsed) {
      if (isAnniversary(value)) { rows.push(value); continue; }
      const migrated = migrateLegacy(value);
      if (migrated !== null && isAnniversary(migrated)) rows.push(migrated);
    }
    return rows.slice(0, MAX_DATES);
  } catch {
    // Restricted storage, or corrupt JSON: the feature is empty, the page still renders.
    return [];
  }
}

export function saveDates(dates: Anniversary[], getStorage?: StorageGetter): void {
  try {
    const storage = getStorage ? getStorage() : window.localStorage;
    storage.setItem(DATES_KEY, JSON.stringify(dates.slice(0, MAX_DATES)));
  } catch {
    // Keep the in-memory list usable when persistence fails; never break rendering over it.
  }
}

// Ids only have to be unique inside one browser's list, so this needs no crypto and no
// dependency — and `crypto.randomUUID` is missing on insecure origins.
export function newId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

/** Validates a draft and returns the list with it appended. Throws a Persian RangeError. */
export function addDate(dates: Anniversary[], draft: Omit<Anniversary, 'id'>): Anniversary[] {
  const title = draft.title.trim();
  if (title.length === 0 || title.length > MAX_TITLE) throw new RangeError(INVALID_TITLE);
  if (dates.length >= MAX_DATES) throw new RangeError(TOO_MANY);
  if (!isRepeat(draft.repeat) || !isCategoryId(draft.category)) throw new RangeError(INVALID_DATE);
  if (draft.repeat === 'monthly') {
    // No month and no year: a monthly thing repeats on a day, and 31 is not a day
    // every Persian month has — `occurrenceOn` clamps it, the same way 30 Esfand is clamped.
    if (draft.month !== null || draft.year !== null) throw new RangeError(INVALID_DATE);
    if (!Number.isInteger(draft.day) || draft.day < 1 || draft.day > 31) throw new RangeError(MONTHLY_DAY);
  } else {
    if (draft.month === null || !Number.isInteger(draft.month) || draft.month < 1 || draft.month > 12) throw new RangeError(INVALID_DATE);
    // Validated against a leap year, so 30 Esfand is accepted: it is a real birthday, and
    // `nextOccurrence` is what decides where it falls in a year that does not have one.
    const longest = monthLength(1403, draft.month);
    if (!Number.isInteger(draft.day) || draft.day < 1 || draft.day > longest) throw new RangeError(INVALID_DATE);
    if (draft.repeat === 'once' && draft.year === null) throw new RangeError(ONCE_NEEDS_YEAR);
    if (draft.year !== null && (!Number.isInteger(draft.year) || draft.year < 1200 || draft.year > 1600)) throw new RangeError(INVALID_DATE);
  }
  return [...dates, { ...draft, title, id: newId() }];
}

export function removeDate(dates: Anniversary[], id: string): Anniversary[] {
  return dates.filter((entry) => entry.id !== id);
}

/**
 * The entry's date in a given Persian year, clamped to the month's real length. 30 Esfand
 * exists only in a leap year; in every other year that birthday is kept on 29 Esfand rather
 * than silently jumping into Farvardin, which would move it past Nowruz.
 */
export function occurrenceIn(entry: Anniversary, year: number): Date {
  return occurrenceOn(entry, year, entry.month ?? 1);
}

/** The entry's day inside one given Persian month, clamped to that month's real length. */
export function occurrenceOn(entry: Anniversary, year: number, month: number): Date {
  return fromCalendar({ year, month, day: Math.min(entry.day, monthLength(year, month)) });
}

export type UpcomingDate = {
  entry: Anniversary;
  date: Date;
  // Whole days from `now`; 0 means today.
  days: number;
  // How many years this occurrence marks, or null when the year is unknown.
  years: number | null;
};

/**
 * The next occurrence of one entry, today included. A 'once' entry that has already
 * happened returns that past date with a negative `days` — the caller decides whether
 * to list it; deciding here would hide a date the visitor typed.
 */
export function nextOccurrence(entry: Anniversary, now: Date): UpcomingDate {
  const today = toCalendar(now);
  const daysFrom = (date: Date) => Math.round((date.getTime() - fromCalendar(today).getTime()) / 86_400_000);
  if (entry.repeat === 'once') {
    const date = occurrenceOn(entry, entry.year ?? today.year, entry.month ?? 1);
    return { entry, date, days: daysFrom(date), years: null };
  }
  if (entry.repeat === 'monthly') {
    const thisMonth = occurrenceOn(entry, today.year, today.month);
    if (toCalendar(thisMonth).day >= today.day) return { entry, date: thisMonth, days: daysFrom(thisMonth), years: null };
    const rolls = today.month === 12;
    const date = occurrenceOn(entry, rolls ? today.year + 1 : today.year, rolls ? 1 : today.month + 1);
    return { entry, date, days: daysFrom(date), years: null };
  }
  const thisYear = occurrenceIn(entry, today.year);
  const thisYearParts = toCalendar(thisYear);
  // Compared as calendar parts rather than instants: both are UTC noon, but the intent is
  // «has this day passed in Tehran», which is a date question.
  const passed = thisYearParts.month < today.month
    || (thisYearParts.month === today.month && thisYearParts.day < today.day);
  const date = passed ? occurrenceIn(entry, today.year + 1) : thisYear;
  const occurrenceYear = passed ? today.year + 1 : today.year;
  return { entry, date, days: daysFrom(date), years: entry.year === null ? null : occurrenceYear - entry.year };
}

/**
 * Every entry's next occurrence, nearest first. A one-off whose day has passed is dropped:
 * it is not upcoming and it never will be again, so leaving it would pin a stale row to the
 * top of a list sorted by nearness.
 */
export function upcomingDates(dates: Anniversary[], now: Date, limit?: number): UpcomingDate[] {
  const list = dates.map((entry) => nextOccurrence(entry, now))
    .filter((item) => item.days >= 0 || item.entry.repeat !== 'once')
    .sort((a, b) => a.days - b.days);
  return limit === undefined ? list : list.slice(0, limit);
}

/** The entries falling on one civil day, for marking a calendar cell. */
export function datesOn(dates: Anniversary[], date: Date): Anniversary[] {
  const { year, month, day } = toCalendar(date);
  return dates.filter((entry) => {
    const clamped = Math.min(entry.day, monthLength(year, month));
    if (entry.repeat === 'monthly') return clamped === day;
    if (entry.month !== month || clamped !== day) return false;
    return entry.repeat !== 'once' || entry.year === year;
  });
}

// The window the export covers. Persian anniversaries do not map onto an RRULE — a yearly
// rule in a Gregorian calendar drifts against the Solar Hijri year — so each year is written
// out explicitly, exactly as the site's own feed does.
export const EXPORT_YEARS = 10;

// Monthly entries are written out too, and ten years of them would be 120 events for one
// instalment. Two years is enough for a loan the visitor will re-export anyway, and the
// description already says the file does not update itself.
export const EXPORT_MONTHS = 24;

function stamp(date: Date): string {
  const value = toCalendar(date, 'gregorian');
  return `${String(value.year).padStart(4, '0')}${String(value.month).padStart(2, '0')}${String(value.day).padStart(2, '0')}`;
}

/**
 * Every date one entry should put in the file. Written out rather than expressed as an
 * RRULE for the reason the yearly ones always were: a Persian day and month does not
 * survive a Gregorian recurrence rule, which drifts against the Solar Hijri year.
 */
function exportOccurrences(entry: Anniversary, now: Date, years: number): Date[] {
  const today = toCalendar(now);
  if (entry.repeat === 'once') {
    const date = occurrenceOn(entry, entry.year ?? today.year, entry.month ?? 1);
    // A one-off in the past is not worth putting in someone's calendar.
    return date.getTime() < fromCalendar(today).getTime() ? [] : [date];
  }
  if (entry.repeat === 'monthly') {
    const dates: Date[] = [];
    for (let offset = 0; offset < EXPORT_MONTHS; offset += 1) {
      const month = ((today.month - 1 + offset) % 12) + 1;
      const year = today.year + Math.floor((today.month - 1 + offset) / 12);
      const date = occurrenceOn(entry, year, month);
      if (date.getTime() >= fromCalendar(today).getTime()) dates.push(date);
    }
    return dates;
  }
  return Array.from({ length: years }, (_, offset) => occurrenceIn(entry, today.year + offset));
}

/**
 * An .ics the visitor adds to their own calendar once. Not a subscription: this list lives in
 * their browser and no server can serve it, so it is a file, and adding a date later means
 * exporting again. The description says so, because a calendar entry outlives the page.
 */
export function buildDatesFile(dates: Anniversary[], now: Date, years = EXPORT_YEARS): string {
  const { year } = toCalendar(now);
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//taghv.im//dates//FA',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${escapeText('تاریخ‌های من — تقویم')}`,
  ];
  for (const entry of dates) {
    for (const occurrence of exportOccurrences(entry, now, years)) {
      const persian = toCalendar(occurrence);
      const count = entry.repeat === 'yearly' && entry.year !== null ? persian.year - entry.year : null;
      if (count !== null && count < 0) continue;
      const age = categoryOf(entry.category).age;
      const suffix = count === null || age === 'none' ? ''
        : age === 'age' ? ` — ${count} سالگی` : ` — ${count}مین سال`;
      lines.push(
        'BEGIN:VEVENT',
        // Yearly keeps its original id-and-year UID so a re-export UPDATES the events
        // someone already imported instead of duplicating them. Monthly cannot: twelve
        // events a year would collapse into one. Those key on the full date.
        `UID:${entry.id}-${entry.repeat === 'yearly' ? persian.year : stamp(occurrence)}@taghv.im`,
        `DTSTAMP:${stamp(now)}T000000Z`,
        `DTSTART;VALUE=DATE:${stamp(occurrence)}`,
        `SUMMARY:${escapeText(entry.title + suffix)}`,
        `DESCRIPTION:${escapeText('از فهرست تاریخ‌های شخصی در taghv.im ساخته شده. این فایل به‌روز نمی‌شود؛ اگر تاریخی اضافه کردی، دوباره خروجی بگیر.')}`,
        'TRANSP:TRANSPARENT',
        'END:VEVENT',
      );
    }
  }
  lines.push('END:VCALENDAR');
  return lines.map(foldLine).join('\r\n') + '\r\n';
}
