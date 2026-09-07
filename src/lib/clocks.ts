// ============================================================================
// Source: src/lib/clocks.ts
// Version: 0.7.0-sandbox — 2026-09-07
// Why: Secondary world clocks. Tehran stays the primary clock everywhere;
//      this only formats other zones and detects the visitor's own zone.
// Env / Deps: Intl only. SANDBOX: used by /sandbox/clocks, not by the site.
//      Delete this file and src/app/sandbox to remove the feature entirely.
// ============================================================================

export const TEHRAN = "Asia/Tehran";

export type Zone = { id: string; city: string; timeZone: string };

// Short by design: places with large Iranian communities, plus the two Gulf
// hubs people actually call. A long list turns this into a world-clock app.
export const ZONES: Zone[] = [
  { id: "toronto", city: "تورنتو", timeZone: "America/Toronto" },
  { id: "vancouver", city: "ونکوور", timeZone: "America/Vancouver" },
  { id: "los-angeles", city: "لس‌آنجلس", timeZone: "America/Los_Angeles" },
  { id: "new-york", city: "نیویورک", timeZone: "America/New_York" },
  { id: "london", city: "لندن", timeZone: "Europe/London" },
  { id: "paris", city: "پاریس", timeZone: "Europe/Paris" },
  { id: "berlin", city: "برلین", timeZone: "Europe/Berlin" },
  { id: "stockholm", city: "استکهلم", timeZone: "Europe/Stockholm" },
  { id: "istanbul", city: "استانبول", timeZone: "Europe/Istanbul" },
  { id: "dubai", city: "دبی", timeZone: "Asia/Dubai" },
  { id: "sydney", city: "سیدنی", timeZone: "Australia/Sydney" },
  { id: "tokyo", city: "توکیو", timeZone: "Asia/Tokyo" },
];

const PERSIAN_DIGITS = "۰۱۲۳۴۵۶۷۸۹";
const persian = (value: string) => value.replace(/[0-9]/g, (digit) => PERSIAN_DIGITS[Number(digit)]);

// HH:MM in Persian digits. Latin digits are formatted first so the output does
// not depend on the fa-IR numbering system, which differs across runtimes.
export function timeIn(date: Date, timeZone: string): string {
  const value = new Intl.DateTimeFormat("en-GB", { timeZone, hour: "2-digit", minute: "2-digit", hour12: false }).format(date);
  return persian(value);
}

// Minutes that `timeZone` is ahead of UTC at this instant, DST included.
export function offsetMinutes(date: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone, hour12: false, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit",
  }).formatToParts(date);
  const at = (type: string) => Number(parts.find((part) => part.type === type)!.value);
  // Intl prints hour 24 for midnight in some runtimes; Date.UTC normalises it.
  const asUtc = Date.UTC(at("year"), at("month") - 1, at("day"), at("hour"), at("minute"), at("second"));
  return Math.round((asUtc - Math.floor(date.getTime() / 1000) * 1000) / 60_000);
}

// Difference from Tehran, as a label like «۳:۳۰ عقب‌تر». Empty when identical.
export function offsetFromTehran(date: Date, timeZone: string): string {
  const delta = offsetMinutes(date, timeZone) - offsetMinutes(date, TEHRAN);
  if (delta === 0) return "";
  const hours = Math.floor(Math.abs(delta) / 60);
  const minutes = Math.abs(delta) % 60;
  const amount = minutes ? `${persian(String(hours))}:${persian(String(minutes).padStart(2, "0"))}` : persian(String(hours));
  return `${amount} ساعت ${delta > 0 ? "جلوتر" : "عقب‌تر"}`;
}

// Whether the day in `timeZone` differs from the day in Tehran right now.
export function dayShift(date: Date, timeZone: string): "" | "دیروز" | "فردا" {
  const day = (zone: string) => new Intl.DateTimeFormat("en-CA", { timeZone: zone, year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
  const here = day(timeZone);
  const tehran = day(TEHRAN);
  if (here === tehran) return "";
  return here < tehran ? "دیروز" : "فردا";
}

// The visitor's own IANA zone, or null when the browser will not say.
export function deviceZone(): string | null {
  try { return Intl.DateTimeFormat().resolvedOptions().timeZone || null; } catch { return null; }
}

// True when the device is effectively on Tehran time, so the extra clock adds
// nothing. Compared by offset, not by name: "Iran" and "Asia/Tehran" are equal.
export function matchesTehran(date: Date, timeZone: string | null): boolean {
  if (!timeZone) return true;
  try { return offsetMinutes(date, timeZone) === offsetMinutes(date, TEHRAN); } catch { return true; }
}

// A readable label for an arbitrary IANA zone: the matching city when we know
// it, otherwise the zone's own last segment with underscores removed.
export function zoneLabel(timeZone: string): string {
  const known = ZONES.find((zone) => zone.timeZone === timeZone);
  if (known) return known.city;
  return timeZone.split("/").pop()!.replace(/_/g, " ");
}
