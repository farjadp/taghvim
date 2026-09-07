// ============================================================================
// Source: src/lib/zodiac.ts
// Version: 0.8.0-sandbox — 2026-09-07
// Why: The zodiac sign for a Persian date. The Solar Hijri months map one to
//      one onto the signs, which is why the Afghan calendar names its months
//      حمل، ثور، جوزا. So this is a lookup, not an astronomical calculation.
// Env / Deps: lib/calendar for the Persian month. SANDBOX: only /sandbox/hero
//      uses it. Delete this file and its test to drop the idea.
// ============================================================================

import { MONTHS, monthLength, toCalendar } from './calendar';

export type Element = 'آتش' | 'خاک' | 'باد' | 'آب';

export type Sign = {
  // 1 = فروردین / حمل
  month: number;
  name: string;
  latin: string;
  symbol: string;
  element: Element;
};

// Order is fixed and matches the Persian months. The four elements repeat in
// the standard آتش، خاک، باد، آب cycle, three signs each.
export const SIGNS: Sign[] = [
  { month: 1, name: 'حمل', latin: 'Aries', symbol: '♈', element: 'آتش' },
  { month: 2, name: 'ثور', latin: 'Taurus', symbol: '♉', element: 'خاک' },
  { month: 3, name: 'جوزا', latin: 'Gemini', symbol: '♊', element: 'باد' },
  { month: 4, name: 'سرطان', latin: 'Cancer', symbol: '♋', element: 'آب' },
  { month: 5, name: 'اسد', latin: 'Leo', symbol: '♌', element: 'آتش' },
  { month: 6, name: 'سنبله', latin: 'Virgo', symbol: '♍', element: 'خاک' },
  { month: 7, name: 'میزان', latin: 'Libra', symbol: '♎', element: 'باد' },
  { month: 8, name: 'عقرب', latin: 'Scorpio', symbol: '♏', element: 'آب' },
  { month: 9, name: 'قوس', latin: 'Sagittarius', symbol: '♐', element: 'آتش' },
  { month: 10, name: 'جدی', latin: 'Capricorn', symbol: '♑', element: 'خاک' },
  { month: 11, name: 'دلو', latin: 'Aquarius', symbol: '♒', element: 'باد' },
  { month: 12, name: 'حوت', latin: 'Pisces', symbol: '♓', element: 'آب' },
];

// Shown with the sign. The mapping is calendrical, not a measured transit.
export const ZODIAC_NOTICE = 'نام برج‌ها همان ترتیب ماه‌های خورشیدی است؛ در تقویم افغانستان ماه‌ها را با همین نام‌ها می‌خوانند. لحظهٔ دقیق ورود خورشید به هر برج ممکن است تا یک روز با آغاز ماه فرق داشته باشد. اینجا فقط برج نجومی نوشته می‌شود، نه پیش‌بینی و طالع.';

// The sign a date falls in, by its Persian month.
export function signFor(date: Date): Sign {
  return SIGNS[toCalendar(date).month - 1];
}

// The Persian month the sign covers, as «۱ تا ۳۱ شهریور».
export function signRange(date: Date): string {
  const { year, month } = toCalendar(date);
  const digits = (value: number) => String(value).replace(/[0-9]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[Number(d)]);
  return `${digits(1)} تا ${digits(monthLength(year, month))} ${MONTHS[month - 1]}`;
}

// How far through the sign the date is, 0 to 1, for a progress indicator.
export function signProgress(date: Date): number {
  const { year, month, day } = toCalendar(date);
  return day / monthLength(year, month);
}
