// ============================================================================
// Source: src/lib/date-tools.ts
// Version: 0.3.0 — 2026-10-09
// Why: Helpers for the tools panel: digit normalisation, age maths, and reading
//      a date written in words («۱۵ خرداد ۱۴۰۶», «۲۵ دسامبر ۲۰۲۶», «فردا») for
//      «تبدیل تاریخ», where one text field replaced a field, a list and a field
//      for screen-reader users (Farjad picked variant C from a sandbox, 9 Oct).
// Env / Deps: lib/calendar for conversions, lib/month-names for the older names.
// ============================================================================

import { addDays, type CalendarKind, daysBetween, fa, formatDate, fromCalendar, GREGORIAN_MONTHS_FA, ISLAMIC_MONTHS, MONTHS, monthLength, toCalendar } from "./calendar";
import { MONTH_NAMES } from "./month-names";

// Accepts Persian (۰-۹), Arabic-Indic (٠-٩) and Latin digits; rejects anything else.
export function parseNumericInput(value: string): number {
  const normalized = value.trim().replace(/[۰-۹]/g, (digit) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit))).replace(/[٠-٩]/g, (digit) => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)));
  if (!/^\d+$/.test(normalized) || !Number.isSafeInteger(Number(normalized))) throw new RangeError("عدد معتبر وارد کنید.");
  return Number(normalized);
}

// Age in Persian-calendar years/months/days. Anniversaries clamp to the shorter month (e.g. 31 → 30 in Esfand).
export function elapsedAge(birthday: Date, today: Date): { years: number; months: number; days: number } {
  if (daysBetween(birthday, today) < 0) throw new RangeError("تاریخ تولد نمی‌تواند در آینده باشد.");
  const start = toCalendar(birthday);
  const end = toCalendar(today);
  // The same calendar day `months` months after birth, clamped to that month's length
  function anniversary(months: number) {
    const index = start.year * 12 + start.month - 1 + months;
    const year = Math.floor(index / 12);
    const month = index % 12 + 1;
    return fromCalendar({ year, month, day: Math.min(start.day, monthLength(year, month)) });
  }
  let months = (end.year - start.year) * 12 + end.month - start.month;
  if (daysBetween(anniversary(months), today) < 0) months -= 1;
  return { years: Math.floor(months / 12), months: months % 12, days: daysBetween(anniversary(months), today) };
}

// --- a date written in words ------------------------------------------------

const ENGLISH_MONTHS = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"];
const KIND_LABEL: Record<CalendarKind, string> = { persian: "خورشیدی", gregorian: "میلادی", islamic: "قمری" };
export const DATE_TEXT_EXAMPLE = "مثلاً ۱۵ خرداد ۱۴۰۶، ۲۵ دسامبر ۲۰۲۶، ۱ رمضان، ۱۴۰۶/۳/۱۵ یا فردا";

// Digits to Latin, Arabic ي/ك/أ to their Persian forms, lower case
const fold = (text: string) => text.toLowerCase()
  .replace(/[۰-۹]/g, (digit) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit)))
  .replace(/[٠-٩]/g, (digit) => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)))
  .replace(/ي/g, "ی").replace(/ك/g, "ک").replace(/[أإآ]/g, "ا");
// …and no spaces or ZWNJ, so «ربیع الاول» and «ربیع‌الاول» are one word
const compact = (text: string) => fold(text).replace(/[\s\u200c]/g, "");

type MonthKey = { key: string; kind: CalendarKind; month: number };
// Longest first, so «مهر» is found before «مه» (May) and «امرداد» before «مرداد»
const MONTH_KEYS: MonthKey[] = [
  ...MONTH_NAMES.flatMap((name, i) => [name.modern, ...(name.older ? [name.older] : [])].map((text) => ({ key: compact(text), kind: "persian" as const, month: i + 1 }))),
  ...GREGORIAN_MONTHS_FA.map((text, i) => ({ key: compact(text), kind: "gregorian" as const, month: i + 1 })),
  ...ENGLISH_MONTHS.map((text, i) => ({ key: text, kind: "gregorian" as const, month: i + 1 })),
  ...ISLAMIC_MONTHS.map((text, i) => ({ key: compact(text), kind: "islamic" as const, month: i + 1 })),
].sort((a, b) => b.key.length - a.key.length);

const RELATIVE: [string, number][] = [["پسفردا", 2], ["پریروز", -2], ["امروز", 0], ["فردا", 1], ["دیروز", -1]];

export type DateTextResult = { ok: true; date: Date; kind: CalendarKind; read: string } | { ok: false; error: string };

// One line of text → a date, and the sentence saying how it was read, so a wrong guess is
// visible (and spoken) rather than silently converted. null for an empty field.
// The calendar comes from the month's name; numbers alone are Persian unless the year is
// past 1700, or a word («میلادی», «قمری») says otherwise. No year means this year in that
// calendar. `months` are the visitor's Persian names, used only in the sentence.
export function parseDateText(text: string, now: Date, months: string[] = MONTHS): DateTextResult | null {
  if (!text.trim()) return null;
  const flat = compact(text);
  const relative = RELATIVE.find(([word]) => flat === word);
  if (relative) {
    const date = addDays(now, relative[1]);
    return { ok: true, date, kind: "persian", read: `${text.trim()}: ${formatDate(date, "persian", true, months)}` };
  }
  const word: CalendarKind | null = /میلادی|gregorian/.test(flat) ? "gregorian" : /قمری|هجری|islamic/.test(flat) ? "islamic" : /شمسی|خورشیدی/.test(flat) ? "persian" : null;
  const numbers = (fold(text).match(/\d+/g) ?? []).map(Number);
  const name = MONTH_KEYS.find((candidate) => flat.includes(candidate.key));
  let kind: CalendarKind, day: number, month: number, year: number | undefined;
  if (name) {
    if (word && word !== name.kind) return { ok: false, error: `«${text.trim()}» هم ماه ${KIND_LABEL[name.kind]} دارد و هم کلمهٔ ${KIND_LABEL[word]}.` };
    if (numbers.length === 0 || numbers.length > 2) return { ok: false, error: "روز را هم بنویس، مثلاً «۱۵ خرداد»." };
    kind = name.kind;
    month = name.month;
    // Two numbers: the larger is the year when it cannot be a day
    const largest = Math.max(...numbers);
    year = numbers.length === 2 && largest > 31 ? largest : undefined;
    day = numbers.length === 2 && year !== undefined ? numbers[numbers.indexOf(largest) === 0 ? 1 : 0] : numbers[0];
    if (numbers.length === 2 && year === undefined) return { ok: false, error: "سال را چهار رقمی بنویس، مثلاً ۱۴۰۶." };
  } else {
    if (numbers.length !== 3) return { ok: false, error: `تاریخ را نشناختم. ${DATE_TEXT_EXAMPLE}.` };
    // y/m/d when the first number cannot be a day, else d/m/y
    [year, month, day] = numbers[0] > 31 ? numbers : [numbers[2], numbers[1], numbers[0]];
    kind = word ?? (year > 1700 ? "gregorian" : "persian");
  }
  try {
    const date = fromCalendar({ year: year ?? toCalendar(now, kind).year, month, day }, kind);
    // The Gregorian date read back in Persian words, as a Persian voice says it
    const g = toCalendar(date, "gregorian");
    const said = kind === "gregorian" ? `${fa(g.day)} ${GREGORIAN_MONTHS_FA[g.month - 1]} ${fa(g.year)}` : formatDate(date, kind, false, months);
    return { ok: true, date, kind, read: `خوانده شد: ${said} (${KIND_LABEL[kind]})${year === undefined ? "، امسال" : ""}` };
  } catch {
    return { ok: false, error: "این تاریخ وجود ندارد یا بیرون از بازهٔ ۱۲۰۰ تا ۱۶۰۰ خورشیدی است." };
  }
}
