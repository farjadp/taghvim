// ============================================================================
// Source: src/lib/date-tools.test.ts
// Version: 0.3.0 — 2026-10-09
// Why: Unit tests for digit parsing, elapsed-age calculation and reading a
//      date written in words.
// Env / Deps: Vitest.
// ============================================================================

import { describe, expect, it } from "vitest";
import { elapsedAge, parseDateText, parseNumericInput } from "./date-tools";
import { dayKey, fromCalendar, MONTHS } from "./calendar";

const date = (year: number, month: number, day: number) => fromCalendar({ year, month, day });

// Digit normalisation must accept all three digit sets and reject everything else
describe("numeric input", () => {
  it("accepts Persian, Arabic and Latin digits", () => {
    expect(parseNumericInput("۱۴۰۳")).toBe(1403);
    expect(parseNumericInput("١٢")).toBe(12);
    expect(parseNumericInput(" 25 ")).toBe(25);
  });
  it("rejects blank, fractions and partial numbers", () => {
    for (const input of ["", "  ", "12x", "1.2", "1e3", "-1"]) expect(() => parseNumericInput(input)).toThrow();
  });
});

describe("Persian calendar age", () => {
  it("reports full years, months and remaining days", () => {
    expect(elapsedAge(date(1375, 3, 20), date(1405, 6, 15))).toEqual({ years: 30, months: 2, days: 26 });
  });
  it("clamps leap-day anniversaries to the last day of Esfand", () => {
    expect(elapsedAge(date(1399, 12, 30), date(1400, 12, 29))).toEqual({ years: 1, months: 0, days: 0 });
  });
  it("handles a birthday today", () => {
    expect(elapsedAge(date(1405, 6, 15), date(1405, 6, 15))).toEqual({ years: 0, months: 0, days: 0 });
  });
  it("rejects future birthdays", () => {
    expect(() => elapsedAge(date(1405, 6, 16), date(1405, 6, 15))).toThrow();
  });
});

// «تبدیل تاریخ» takes one line of text; the calendar comes from the month's name
describe("date written in words", () => {
  // 16 Mehr 1405 = 8 October 2026 = 26 Rabi al-Thani 1448 (computed)
  const now = date(1405, 7, 16);
  const read = (text: string) => {
    const result = parseDateText(text, now);
    if (!result || !result.ok) throw new Error(`not read: ${text} → ${JSON.stringify(result)}`);
    return result;
  };
  const same = (a: Date, b: Date) => expect(dayKey(a)).toBe(dayKey(b));

  it("reads a Persian date by its month's name, in any digits", () => {
    same(read("۱۵ خرداد ۱۴۰۶").date, date(1406, 3, 15));
    same(read("15 خرداد 1406").date, date(1406, 3, 15));
    expect(read("۱۵ خرداد ۱۴۰۶").kind).toBe("persian");
    expect(read("۱۵ خرداد ۱۴۰۶").read).toBe("خوانده شد: ۱۵ خرداد ۱۴۰۶ (خورشیدی)");
  });

  it("takes the calendar from the month: Gregorian in Persian or English, and lunar", () => {
    same(read("۲۵ دسامبر ۲۰۲۶").date, fromCalendar({ year: 2026, month: 12, day: 25 }, "gregorian"));
    same(read("25 December 2026").date, fromCalendar({ year: 2026, month: 12, day: 25 }, "gregorian"));
    expect(read("۲۵ دسامبر ۲۰۲۶").read).toBe("خوانده شد: ۲۵ دسامبر ۲۰۲۶ (میلادی)");
    expect(read("۱ رمضان ۱۴۴۸").kind).toBe("islamic");
    same(read("۱۲ ربیع الاول ۱۴۴۸").date, read("۱۲ ربیع‌الاول ۱۴۴۸").date);
  });

  it("the longer name wins: «مهر» is not «مه», «امرداد» is Mordad", () => {
    expect(read("۱۰ مهر ۱۴۰۵").kind).toBe("persian");
    same(read("۱۰ امرداد ۱۴۰۵").date, date(1405, 5, 10));
    expect(read("۵ مه ۲۰۲۷").kind).toBe("gregorian");
  });

  it("with no year it is this year in that calendar, and says so", () => {
    same(read("۲۰ آذر").date, date(1405, 9, 20));
    expect(read("۲۰ آذر").read.endsWith("، امسال")).toBe(true);
  });

  it("reads numbers either way round, and a year past 1700 as Gregorian", () => {
    same(read("۱۴۰۶/۳/۱۵").date, date(1406, 3, 15));
    same(read("15/3/1406").date, date(1406, 3, 15));
    same(read("2026-12-25").date, fromCalendar({ year: 2026, month: 12, day: 25 }, "gregorian"));
    expect(read("1448/9/1 قمری").kind).toBe("islamic");
  });

  it("reads today, tomorrow and the days around them", () => {
    same(read("امروز").date, now);
    same(read("فردا").date, date(1405, 7, 17));
    same(read("پس‌فردا").date, date(1405, 7, 18));
    same(read("دیروز").date, date(1405, 7, 15));
  });

  it("uses the visitor's month names when it says what it read", () => {
    const older = [...MONTHS];
    older[4] = "امرداد";
    const result = parseDateText("۱۰ مرداد ۱۴۰۵", now, older);
    expect(result?.ok && result.read).toBe("خوانده شد: ۱۰ امرداد ۱۴۰۵ (خورشیدی)");
  });

  it("refuses what does not exist, contradicts itself or is not a date", () => {
    expect(parseDateText("", now)).toBeNull();
    expect(parseDateText("  ", now)).toBeNull();
    for (const text of ["۳۰ اسفند ۱۴۰۴", "۱۵ خرداد میلادی", "سلام", "خرداد", "۱۵/۳", "۴۰ خرداد ۱۴۰۶"]) {
      expect(parseDateText(text, now)?.ok, text).toBe(false);
    }
    // 1404 is not a leap year; 1403 is
    expect(parseDateText("۳۰ اسفند ۱۴۰۳", now)?.ok).toBe(true);
  });
});
