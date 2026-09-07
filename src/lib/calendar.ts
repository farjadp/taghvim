// ============================================================================
// Source: src/lib/calendar.ts
// Version: 0.2.0 — 2026-09-07
// Why: Calendar core: Jalali/Gregorian/Hijri conversion, formatting, month grids.
//      Every instant is read as a civil day in Asia/Tehran and returned at UTC noon.
// Env / Deps: jalaali-js for Jalali; Intl islamic-civil for Hijri. Range 1200–1600 SH.
// ============================================================================

import { jalaaliMonthLength, toGregorian, toJalaali } from 'jalaali-js';

export type CalendarKind = 'persian' | 'gregorian' | 'islamic';
export type CalendarDate = { year: number; month: number; day: number };

export const MONTHS: string[] = [
  'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
  'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند',
];

export const WEEKDAYS: string[] = [
  'شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه', 'جمعه',
];

export const ISLAMIC_NOTICE = 'تاریخ قمری با تقویم محاسباتی islamic-civil محاسبه می‌شود؛ مبتنی بر رؤیت هلال نیست و ممکن است با تقویم رسمی ایران تفاوت داشته باشد.';

const ISLAMIC_MONTHS = [
  'محرم', 'صفر', 'ربیع‌الاول', 'ربیع‌الثانی', 'جمادی‌الاول', 'جمادی‌الثانی',
  'رجب', 'شعبان', 'رمضان', 'شوال', 'ذی‌القعده', 'ذی‌الحجه',
];
const GREGORIAN_MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
// Internally every date is an integer day count; `noon()` turns it back into a UTC-noon Date.
const DAY_MS = 86_400_000;
const MIN_YEAR = 1200;
const MAX_YEAR = 1600;
// Reads the civil date in Tehran regardless of the host machine's timezone.
const tehranFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: 'Asia/Tehran', calendar: 'gregory', numberingSystem: 'latn',
  year: 'numeric', month: 'numeric', day: 'numeric',
});
// islamic-civil is arithmetic, not observational — see ISLAMIC_NOTICE.
const islamicFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: 'Asia/Tehran', calendar: 'islamic-civil', numberingSystem: 'latn',
  year: 'numeric', month: 'numeric', day: 'numeric',
});

function integer(value: number): void {
  if (!Number.isSafeInteger(value)) throw new RangeError('Calendar values must be safe integers.');
}

function validateKind(kind: CalendarKind): void {
  if (kind !== 'persian' && kind !== 'gregorian' && kind !== 'islamic') {
    throw new RangeError('Unsupported calendar kind.');
  }
}

function validateMonth(year: number, month: number): void {
  integer(year);
  integer(month);
  if (month < 1 || month > 12) throw new RangeError('Month must be between 1 and 12.');
}

function validatePersianYear(year: number): void {
  integer(year);
  if (year < MIN_YEAR || year > MAX_YEAR) throw new RangeError('Supported Persian years are 1200–1600.');
}

function gregorianDay(year: number, month: number, day: number): number {
  return Date.UTC(year, month - 1, day) / DAY_MS;
}

function persianDay(year: number, month: number, day: number): number {
  const value = toGregorian(year, month, day);
  return gregorianDay(value.gy, value.gm, value.gd);
}

const MIN_DAY = persianDay(MIN_YEAR, 1, 1);
const MAX_DAY = persianDay(MAX_YEAR, 12, jalaaliMonthLength(MAX_YEAR, 12));
const MIN_GREGORIAN_YEAR = toGregorian(MIN_YEAR, 1, 1).gy;
const MAX_GREGORIAN_YEAR = toGregorian(MAX_YEAR, 12, jalaaliMonthLength(MAX_YEAR, 12)).gy;

// Guards the 1200–1600 SH window; callers must not pass padding cells outside it.
function supported(day: number): number {
  integer(day);
  if (day < MIN_DAY || day > MAX_DAY) throw new RangeError('Date is outside Persian years 1200–1600.');
  return day;
}

function noon(day: number): Date {
  return new Date(day * DAY_MS + DAY_MS / 2);
}

function parts(date: Date, formatter: Intl.DateTimeFormat): CalendarDate {
  const values = formatter.formatToParts(date);
  const component = (type: 'year' | 'month' | 'day') => {
    const value = Number(values.find((part) => part.type === type)?.value);
    if (!Number.isSafeInteger(value)) throw new RangeError('Calendar data is unavailable in this runtime.');
    return value;
  };
  return { year: component('year'), month: component('month'), day: component('day') };
}

function tehranDay(date: Date): number {
  if (!(date instanceof Date) || !Number.isFinite(date.getTime())) throw new RangeError('Invalid Date.');
  if (date.getUTCFullYear() < MIN_GREGORIAN_YEAR - 1 || date.getUTCFullYear() > MAX_GREGORIAN_YEAR + 1) {
    throw new RangeError('Date is outside Persian years 1200–1600.');
  }
  const { year, month, day } = parts(date, tehranFormatter);
  if (year < MIN_GREGORIAN_YEAR || year > MAX_GREGORIAN_YEAR) {
    throw new RangeError('Date is outside Persian years 1200–1600.');
  }
  return supported(gregorianDay(year, month, day));
}

function persianParts(day: number): CalendarDate {
  const date = noon(day);
  const value = toJalaali(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate());
  return { year: value.jy, month: value.jm, day: value.jd };
}

function islamicParts(day: number): CalendarDate {
  if (islamicFormatter.resolvedOptions().calendar !== 'islamic-civil') {
    throw new RangeError('This runtime does not support the islamic-civil calendar.');
  }
  return parts(noon(day), islamicFormatter);
}

function compareDates(a: CalendarDate, b: CalendarDate): number {
  return a.year - b.year || a.month - b.month || a.day - b.day;
}

function islamicDay(value: CalendarDate): number {
  let low = MIN_DAY - 62;
  let high = MAX_DAY + 62;
  while (low <= high) {
    const middle = Math.floor((low + high) / 2);
    const comparison = compareDates(islamicParts(middle), value);
    if (comparison === 0) return middle;
    if (comparison < 0) low = middle + 1;
    else high = middle - 1;
  }
  throw new RangeError('Invalid or unsupported Islamic civil date.');
}

// Persian digits for display. Input numbers stay Latin everywhere else.
export function fa(value: number | string): string {
  if (typeof value === 'number' && !Number.isFinite(value)) throw new RangeError('Invalid number.');
  return String(value).replace(/[0-9]/g, (digit) => '۰۱۲۳۴۵۶۷۸۹'[Number(digit)]);
}

// Instant → civil date in the requested calendar, interpreted in Asia/Tehran.
export function toCalendar(date: Date, kind: CalendarKind = 'persian'): CalendarDate {
  validateKind(kind);
  const day = tehranDay(date);
  if (kind === 'persian') return persianParts(day);
  if (kind === 'islamic') return islamicParts(day);
  const normalized = noon(day);
  return { year: normalized.getUTCFullYear(), month: normalized.getUTCMonth() + 1, day: normalized.getUTCDate() };
}

// Civil date → UTC-noon instant. Validates range and month/day for the calendar kind.
export function fromCalendar(value: CalendarDate, kind: CalendarKind = 'persian'): Date {
  validateKind(kind);
  if (!value || typeof value !== 'object') throw new RangeError('Invalid calendar date.');
  const { year, month, day } = value;
  validateMonth(year, month);
  integer(day);
  if (day < 1 || day > monthLength(year, month, kind)) throw new RangeError('Day is invalid for this month.');
  if (kind === 'persian') return noon(supported(persianDay(year, month, day)));
  if (kind === 'gregorian') return noon(supported(gregorianDay(year, month, day)));
  return noon(supported(islamicDay(value)));
}

export function dayKey(date: Date): string {
  const value = noon(tehranDay(date));
  return `${String(value.getUTCFullYear()).padStart(4, '0')}-${String(value.getUTCMonth() + 1).padStart(2, '0')}-${String(value.getUTCDate()).padStart(2, '0')}`;
}

export function addDays(date: Date, amount: number): Date {
  integer(amount);
  return noon(supported(tehranDay(date) + amount));
}

export function monthLength(year: number, month: number, kind: CalendarKind = 'persian'): number {
  validateKind(kind);
  validateMonth(year, month);
  if (kind === 'persian') {
    validatePersianYear(year);
    return jalaaliMonthLength(year, month);
  }
  if (kind === 'gregorian') {
    if (year < MIN_GREGORIAN_YEAR || year > MAX_GREGORIAN_YEAR) {
      throw new RangeError('Month is outside Persian years 1200–1600.');
    }
    const first = gregorianDay(year, month, 1);
    const next = gregorianDay(year, month + 1, 1);
    if (next <= MIN_DAY || first > MAX_DAY) throw new RangeError('Month is outside the supported range.');
    return next - first;
  }
  const first = islamicDay({ year, month, day: 1 });
  const next = islamicDay({ year: month === 12 ? year + 1 : year, month: month === 12 ? 1 : month + 1, day: 1 });
  if (next <= MIN_DAY || first > MAX_DAY) throw new RangeError('Month is outside the supported range.');
  return next - first;
}

// Saturday-first grid, padded with adjacent-month days to whole weeks (minimum 5 rows).
export function monthGrid(year: number, month: number): {
  date: Date; persian: CalendarDate; inMonth: boolean; isFriday: boolean;
}[] {
  const length = monthLength(year, month);
  const first = persianDay(year, month, 1);
  const offset = (noon(first).getUTCDay() + 1) % 7;
  const count = Math.max(35, Math.ceil((offset + length) / 7) * 7);
  return Array.from({ length: count }, (_, index) => {
    const day = first - offset + index;
    const persian = persianParts(day);
    return {
      date: noon(day), persian,
      inMonth: persian.year === year && persian.month === month,
      isFriday: index % 7 === 6,
    };
  });
}

export function shiftMonth(year: number, month: number, delta: number): { year: number; month: number } {
  validateMonth(year, month);
  validatePersianYear(year);
  integer(delta);
  const total = year * 12 + month - 1 + delta;
  integer(total);
  const nextYear = Math.floor(total / 12);
  validatePersianYear(nextYear);
  return { year: nextYear, month: total - nextYear * 12 + 1 };
}

export function formatDate(date: Date, kind: CalendarKind = 'persian', withWeekday = false): string {
  const value = toCalendar(date, kind);
  const names = kind === 'persian' ? MONTHS : kind === 'islamic' ? ISLAMIC_MONTHS : GREGORIAN_MONTHS;
  const label = kind === 'gregorian'
    ? `${value.day} ${names[value.month - 1]} ${value.year}`
    : `${fa(value.day)} ${names[value.month - 1]} ${fa(value.year)}`;
  if (!withWeekday) return label;
  const weekday = (noon(tehranDay(date)).getUTCDay() + 1) % 7;
  if (kind === 'gregorian') {
    const name = ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'][weekday];
    return `${name}, ${label}`;
  }
  return `${WEEKDAYS[weekday]}، ${label}`;
}

export function daysBetween(a: Date, b: Date): number {
  return tehranDay(b) - tehranDay(a);
}

export function dateNumbers(date: Date, kind: CalendarKind = 'persian'): string {
  const { year, month, day } = toCalendar(date, kind);
  const separator = kind === 'gregorian' ? '-' : '/';
  const value = [String(year).padStart(4, '0'), String(month).padStart(2, '0'), String(day).padStart(2, '0')].join(separator);
  return kind === 'gregorian' ? value : fa(value);
}
