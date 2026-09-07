// ============================================================================
// Source: src/lib/prayer.test.ts
// Version: 0.2.0 — 2026-09-07
// Why: Unit tests for prayer-time ordering, city coverage and midnight rule.
// Env / Deps: Vitest.
// ============================================================================

import { describe, expect, it } from "vitest";
import { CITIES, prayerTimes, type PrayerTime } from "./prayer";

// Fixed reference day so the expected ordering does not drift with the wall clock
const referenceDate = new Date("2026-09-06T12:00:00+03:30");
const keys = ["fajr", "sunrise", "dhuhr", "sunset", "maghrib", "midnight"];

function timestamp(times: PrayerTime[], key: string): number {
  return times.find((entry) => entry.key === key)!.timestamp;
}

describe("prayerTimes", () => {
  it("calculates deterministic Tehran-method values for Tehran on 2026-09-06", () => {
    const result = prayerTimes(referenceDate, "tehran");
    expect(result.map((entry) => entry.key)).toEqual(keys);
    expect(result.map((entry) => entry.time)).toEqual([
      "۰۴:۱۴", "۰۵:۴۰", "۱۲:۰۳", "۱۸:۲۵", "۱۸:۴۳", "۲۳:۲۰",
    ]);
    expect(result.map((entry) => new Date(entry.timestamp).toISOString())).toEqual([
      "2026-09-06T00:44:00.000Z",
      "2026-09-06T02:10:00.000Z",
      "2026-09-06T08:33:00.000Z",
      "2026-09-06T14:55:00.000Z",
      "2026-09-06T15:13:00.000Z",
      "2026-09-06T19:50:00.000Z",
    ]);
    expect(prayerTimes(referenceDate, "tehran")).toEqual(result);
  });

  it("supports the requested Iranian cities with distinct calculations", () => {
    const required = [
      "tehran", "mashhad", "isfahan", "shiraz", "tabriz", "rasht",
      "yazd", "ahvaz", "qom", "bandar-abbas", "kermanshah", "zahedan",
    ];
    expect(CITIES.map((city) => city.id)).toEqual(expect.arrayContaining(required));
    expect(new Set(CITIES.map((city) => city.id)).size).toBe(CITIES.length);
    for (const city of CITIES) {
      expect(city.name).toMatch(/[آ-ی]/);
      expect(city.latitude).toBeGreaterThan(25);
      expect(city.latitude).toBeLessThan(40);
      expect(city.longitude).toBeGreaterThan(44);
      expect(city.longitude).toBeLessThan(64);
      const result = prayerTimes(referenceDate, city.id);
      expect(result).toHaveLength(6);
      for (const [index, entry] of result.entries()) {
        expect(entry.time).toMatch(/^[۰-۹]{2}:[۰-۹]{2}$/);
        expect(entry.label).toMatch(/[آ-ی]/);
        expect(Number.isFinite(entry.timestamp)).toBe(true);
        if (index > 0) expect(entry.timestamp).toBeGreaterThan(result[index - 1].timestamp);
      }
    }
    expect(timestamp(prayerTimes(referenceDate, "mashhad"), "dhuhr"))
      .toBeLessThan(timestamp(prayerTimes(referenceDate, "tehran"), "dhuhr"));
    expect(timestamp(prayerTimes(referenceDate, "tabriz"), "dhuhr"))
      .toBeGreaterThan(timestamp(prayerTimes(referenceDate, "tehran"), "dhuhr"));
  });

  it("uses the Tehran civil date on both sides of midnight, not the UTC or host date", () => {
    const september6 = prayerTimes(referenceDate, "tehran");
    expect(prayerTimes(new Date("2026-09-05T20:30:00Z"), "tehran")).toEqual(september6);
    expect(prayerTimes(new Date("2026-09-06T20:29:59.999Z"), "tehran")).toEqual(september6);
    const september7 = prayerTimes(new Date("2026-09-07T12:00:00+03:30"), "tehran");
    expect(prayerTimes(new Date("2026-09-06T20:30:00Z"), "tehran")).toEqual(september7);
    expect(september7).not.toEqual(september6);
  });

  it.each([
    ["2026-09-06", "2026-09-07"],
    ["2026-12-31", "2027-01-01"],
    ["2028-02-29", "2028-03-01"],
    ["2026-06-21", "2026-06-22"],
  ])("uses sunset to next-day fajr for Jafari midnight on %s", (day, nextDay) => {
    expect(CITIES.length).toBeGreaterThanOrEqual(12);
    for (const city of CITIES) {
      const today = prayerTimes(new Date(`${day}T12:00:00+03:30`), city.id);
      const tomorrow = prayerTimes(new Date(`${nextDay}T12:00:00+03:30`), city.id);
      expect(timestamp(today, "midnight")).toBe(
        (timestamp(today, "sunset") + timestamp(tomorrow, "fajr")) / 2,
      );
      expect(timestamp(today, "midnight")).not.toBe(
        (timestamp(today, "maghrib") + timestamp(tomorrow, "sunrise")) / 2,
      );
    }
  });

  it("does not mutate the supplied instant", () => {
    const date = new Date(referenceDate);
    prayerTimes(date, "tehran");
    expect(date.getTime()).toBe(referenceDate.getTime());
  });

  it.each(["", "unknown", "Tehran"])("rejects unknown city %j", (cityId) => {
    expect(() => prayerTimes(referenceDate, cityId)).toThrow(/city/i);
  });

  it.each([new Date(NaN), null, "2026-09-06"])("rejects invalid date %j", (date) => {
    expect(() => prayerTimes(date as Date, "tehran")).toThrow(/date/i);
  });
});
