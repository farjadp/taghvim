// ============================================================================
// Source: src/lib/dates.ts
// Version: 0.1.0 — 2026-09-09
// Why: The visitor's own birthdays and anniversaries: stored in their browser,
//      never sent anywhere, and exportable as an .ics so their own calendar
//      does the reminding — this app has no server to remind them from.
// Env / Deps: Persists `taghvim-dates` in localStorage, guarded the way
//      lib/view.ts guards its record. Reuses lib/ics.ts for the export.
//      This is the first thing the app stores that is CONTENT, not a setting:
//      /about#privacy has to say so.
// ============================================================================

import { fromCalendar, monthLength, toCalendar } from './calendar';
import { escapeText, foldLine } from './ics';

// 'birthday' shows «۳۰ ساله می‌شود», 'anniversary' shows «۳۰مین سال». The arithmetic is
// identical; only the sentence differs, and a wrong sentence about a person reads badly.
export type DateKind = 'birthday' | 'anniversary';

export type Anniversary = {
  id: string;
  title: string;
  kind: DateKind;
  // Persian month and day. `year` is optional: plenty of people know the day and not the year.
  month: number;
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

type StorageGetter = () => Storage;

function isAnniversary(value: unknown): value is Anniversary {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
  const record = value as Record<string, unknown>;
  return typeof record.id === 'string' && record.id.length > 0
    && typeof record.title === 'string' && record.title.length > 0 && record.title.length <= MAX_TITLE
    && (record.kind === 'birthday' || record.kind === 'anniversary')
    && typeof record.month === 'number' && Number.isInteger(record.month) && record.month >= 1 && record.month <= 12
    && typeof record.day === 'number' && Number.isInteger(record.day) && record.day >= 1 && record.day <= 31
    && (record.year === null || (typeof record.year === 'number' && Number.isInteger(record.year) && record.year >= 1200 && record.year <= 1600));
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
    return parsed.filter(isAnniversary).slice(0, MAX_DATES);
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
  if (!Number.isInteger(draft.month) || draft.month < 1 || draft.month > 12) throw new RangeError(INVALID_DATE);
  // Validated against a leap year, so 30 Esfand is accepted: it is a real birthday, and
  // `nextOccurrence` is what decides where it falls in a year that does not have one.
  const longest = monthLength(1403, draft.month);
  if (!Number.isInteger(draft.day) || draft.day < 1 || draft.day > longest) throw new RangeError(INVALID_DATE);
  if (draft.year !== null && (!Number.isInteger(draft.year) || draft.year < 1200 || draft.year > 1600)) throw new RangeError(INVALID_DATE);
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
  const day = Math.min(entry.day, monthLength(year, entry.month));
  return fromCalendar({ year, month: entry.month, day });
}

export type UpcomingDate = {
  entry: Anniversary;
  date: Date;
  // Whole days from `now`; 0 means today.
  days: number;
  // How many years this occurrence marks, or null when the year is unknown.
  years: number | null;
};

/** The next occurrence of one entry, today included. */
export function nextOccurrence(entry: Anniversary, now: Date): UpcomingDate {
  const { year } = toCalendar(now);
  const today = toCalendar(now);
  const thisYear = occurrenceIn(entry, year);
  const thisYearParts = toCalendar(thisYear);
  // Compared as calendar parts rather than instants: both are UTC noon, but the intent is
  // «has this day passed in Tehran», which is a date question.
  const passed = thisYearParts.month < today.month
    || (thisYearParts.month === today.month && thisYearParts.day < today.day);
  const date = passed ? occurrenceIn(entry, year + 1) : thisYear;
  const occurrenceYear = passed ? year + 1 : year;
  const days = Math.round((date.getTime() - fromCalendar(today).getTime()) / 86_400_000);
  return { entry, date, days, years: entry.year === null ? null : occurrenceYear - entry.year };
}

/** Every entry's next occurrence, nearest first. */
export function upcomingDates(dates: Anniversary[], now: Date, limit?: number): UpcomingDate[] {
  const list = dates.map((entry) => nextOccurrence(entry, now)).sort((a, b) => a.days - b.days);
  return limit === undefined ? list : list.slice(0, limit);
}

/** The entries falling on one civil day, for marking a calendar cell. */
export function datesOn(dates: Anniversary[], date: Date): Anniversary[] {
  const { year, month, day } = toCalendar(date);
  return dates.filter((entry) => entry.month === month && Math.min(entry.day, monthLength(year, entry.month)) === day);
}

// The window the export covers. Persian anniversaries do not map onto an RRULE — a yearly
// rule in a Gregorian calendar drifts against the Solar Hijri year — so each year is written
// out explicitly, exactly as the site's own feed does.
export const EXPORT_YEARS = 10;

function stamp(date: Date): string {
  const value = toCalendar(date, 'gregorian');
  return `${String(value.year).padStart(4, '0')}${String(value.month).padStart(2, '0')}${String(value.day).padStart(2, '0')}`;
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
    for (let offset = 0; offset < years; offset += 1) {
      const occurrence = occurrenceIn(entry, year + offset);
      const persian = toCalendar(occurrence);
      const count = entry.year === null ? null : persian.year - entry.year;
      if (count !== null && count < 0) continue;
      const suffix = count === null ? '' : entry.kind === 'birthday' ? ` — ${count} سالگی` : ` — ${count}مین سال`;
      lines.push(
        'BEGIN:VEVENT',
        `UID:${entry.id}-${persian.year}@taghv.im`,
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
