// ============================================================================
// Source: src/lib/clocks.test.ts
// Version: 0.7.0-sandbox — 2026-09-07
// Why: Guards the offset maths, which is the part most likely to be wrong,
//      and the Tehran-match rule that decides whether a clock is shown at all.
// Env / Deps: Vitest.
// ============================================================================

import { describe, expect, it } from "vitest";
import { TEHRAN, ZONES, dayShift, matchesTehran, offsetFromTehran, offsetMinutes, timeIn, zoneLabel } from "./clocks";

// 7 Sep 2026, 12:00 UTC. Tehran is +03:30 year round (no DST since 1401).
const noonUtc = new Date("2026-09-07T12:00:00Z");

describe("world clocks", () => {
  it("puts Tehran at +03:30 and formats its time in Persian digits", () => {
    expect(offsetMinutes(noonUtc, TEHRAN)).toBe(210);
    expect(timeIn(noonUtc, TEHRAN)).toBe("۱۵:۳۰");
  });

  it("computes real offsets including daylight saving", () => {
    // Toronto is EDT (-4) in September, EST (-5) in January
    expect(offsetMinutes(new Date("2026-09-07T12:00:00Z"), "America/Toronto")).toBe(-240);
    expect(offsetMinutes(new Date("2026-01-07T12:00:00Z"), "America/Toronto")).toBe(-300);
  });

  it("describes the gap from Tehran in words", () => {
    expect(offsetFromTehran(noonUtc, "America/Toronto")).toBe("۷:۳۰ ساعت عقب‌تر");
    expect(offsetFromTehran(noonUtc, "Asia/Tokyo")).toBe("۵:۳۰ ساعت جلوتر");
    // Dubai is UTC+4, half an hour ahead of Tehran
    expect(offsetFromTehran(noonUtc, "Asia/Dubai")).toBe("۰:۳۰ ساعت جلوتر");
    expect(offsetFromTehran(noonUtc, TEHRAN)).toBe("");
  });

  it("flags when another zone is on a different day", () => {
    // 22:00 UTC is 01:30 next day in Tehran, still the same evening in Toronto
    const lateUtc = new Date("2026-09-07T22:00:00Z");
    expect(dayShift(lateUtc, "America/Toronto")).toBe("دیروز");
    expect(dayShift(noonUtc, TEHRAN)).toBe("");
  });

  it("treats a device already on Tehran time as needing no second clock", () => {
    expect(matchesTehran(noonUtc, TEHRAN)).toBe(true);
    expect(matchesTehran(noonUtc, "Iran")).toBe(true);
    expect(matchesTehran(noonUtc, null)).toBe(true);
    expect(matchesTehran(noonUtc, "Europe/London")).toBe(false);
    // An unknown zone must not throw; it just means "do not show anything"
    expect(matchesTehran(noonUtc, "Mars/Olympus")).toBe(true);
  });

  it("names known cities and degrades gracefully for the rest", () => {
    expect(zoneLabel("America/Toronto")).toBe("تورنتو");
    expect(zoneLabel("America/Argentina/Buenos_Aires")).toBe("Buenos Aires");
    expect(new Set(ZONES.map((zone) => zone.id)).size).toBe(ZONES.length);
    for (const zone of ZONES) expect(() => timeIn(noonUtc, zone.timeZone)).not.toThrow();
  });
});
