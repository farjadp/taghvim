// ============================================================================
// Source: src/lib/date-tools.ts
// Version: 0.2.0 — 2026-09-07
// Why: Numeric helpers for the tools panel: digit normalisation and age maths.
// Env / Deps: Depends on lib/calendar for conversions.
// ============================================================================

import { daysBetween, fromCalendar, monthLength, toCalendar } from "./calendar";

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
