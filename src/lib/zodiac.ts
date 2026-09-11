// ============================================================================
// Source: src/lib/zodiac.ts
// Version: 0.8.0 — 2026-09-07
// Why: The zodiac sign for a Persian date. The Solar Hijri months map one to
//      one onto the signs, which is why the Afghan calendar names its months
//      حمل، ثور، جوزا. So this is a lookup, not an astronomical calculation.
//      Glyphs are SVG (lucide's Zodiac* icons), never emoji or font characters.
// Env / Deps: lib/calendar for the Persian month. Shown in the side card of
//      the hero row; components/zodiac-icon draws the glyph.
// ============================================================================

import { MONTHS, monthLength, toCalendar } from './calendar';

export type Element = 'آتش' | 'خاک' | 'باد' | 'آب';

export type Sign = {
  // 1 = فروردین / حمل
  month: number;
  name: string;
  // Also the icon key: components/zodiac-icon maps it to the lucide glyph.
  latin: string;
  element: Element;
};

// Order is fixed and matches the Persian months. The four elements repeat in
// the standard آتش، خاک، باد، آب cycle, three signs each.
export const SIGNS: Sign[] = [
  { month: 1, name: 'حمل', latin: 'Aries', element: 'آتش' },
  { month: 2, name: 'ثور', latin: 'Taurus', element: 'خاک' },
  { month: 3, name: 'جوزا', latin: 'Gemini', element: 'باد' },
  { month: 4, name: 'سرطان', latin: 'Cancer', element: 'آب' },
  { month: 5, name: 'اسد', latin: 'Leo', element: 'آتش' },
  { month: 6, name: 'سنبله', latin: 'Virgo', element: 'خاک' },
  { month: 7, name: 'میزان', latin: 'Libra', element: 'باد' },
  { month: 8, name: 'عقرب', latin: 'Scorpio', element: 'آب' },
  { month: 9, name: 'قوس', latin: 'Sagittarius', element: 'آتش' },
  { month: 10, name: 'جدی', latin: 'Capricorn', element: 'خاک' },
  { month: 11, name: 'دلو', latin: 'Aquarius', element: 'باد' },
  { month: 12, name: 'حوت', latin: 'Pisces', element: 'آب' },
];

// The mapping is calendrical, not a measured transit. The sign's own line under the
// hero no longer says so — Farjad cut it on 10 Sep — and ZODIAC_NOTICE on the about
// page is where that is explained.

export const ZODIAC_NOTICE = 'نام برج‌ها همان ترتیب ماه‌های خورشیدی است؛ در تقویم افغانستان ماه‌ها را با همین نام‌ها می‌خوانند. لحظهٔ دقیق ورود خورشید به هر برج ممکن است تا یک روز با آغاز ماه فرق داشته باشد. اینجا فقط برج نجومی نوشته می‌شود، نه پیش‌بینی و طالع.';

// The sign a date falls in, by its Persian month.
export function signFor(date: Date): Sign {
  return SIGNS[toCalendar(date).month - 1];
}

// The Persian month the sign covers, as «۱ تا ۳۱ شهریور».
export function signRange(date: Date, months: string[] = MONTHS): string {
  const { year, month } = toCalendar(date);
  const digits = (value: number) => String(value).replace(/[0-9]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[Number(d)]);
  return `${digits(1)} تا ${digits(monthLength(year, month))} ${months[month - 1]}`;
}

// How far through the sign the date is, 0 to 1, for a progress indicator.
export function signProgress(date: Date): number {
  const { year, month, day } = toCalendar(date);
  return day / monthLength(year, month);
}
