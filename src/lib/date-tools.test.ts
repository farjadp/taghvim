// ============================================================================
// Source: src/lib/date-tools.test.ts
// Version: 0.2.0 — 2026-09-07
// Why: Unit tests for digit parsing and elapsed-age calculation.
// Env / Deps: Vitest.
// ============================================================================

import { describe, expect, it } from "vitest";
import { elapsedAge, parseNumericInput } from "./date-tools";
import { fromCalendar } from "./calendar";

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
