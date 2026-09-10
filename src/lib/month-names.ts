// ============================================================================
// Source: src/lib/month-names.ts
// Version: 0.1.0 — 2026-09-10
// Why: Where each Persian month name comes from and what it meant. Asked for by
//      @JustsayAlireza (#95), who wanted «امرداد» rather than «مرداد».
// Env / Deps: Pure data, no imports. Order matches MONTHS in lib/calendar.ts —
//      index 0 is فروردین — and a test pins them together, because a month named
//      out of order is worse than no meaning at all.
//
//      WORTH KNOWING BEFORE READING THIS AS «the Avestan calendar»: the twelve
//      modern names ARE the Avestan ones, worn down by Middle Persian. Nothing
//      here replaces a calendar. Exactly TWO months still carry an older form
//      that differs in writing, and only one of them changes meaning:
//        مرداد → امرداد   the alef is the negation; without it the word reads as
//                         its own opposite, «death» for «undying»
//        اسفند → سپندارمذ  the fuller form of the same name, not a correction
//      The other ten are given their origin and meaning and keep their spelling.
// ============================================================================

export type MonthName = {
  // As the calendar writes it today
  modern: string;
  // The older Persian form, when it is genuinely a different spelling
  older: string | null;
  // The Avestan word it descends from, transcribed for a Persian reader
  avestan: string;
  // What that word meant. One line: this sits under a name, not in an essay.
  meaning: string;
};

export const MONTH_NAMES: MonthName[] = [
  { modern: 'فروردین', older: null, avestan: 'فْرَوَشی', meaning: 'فروهرها، روان درگذشتگان' },
  { modern: 'اردیبهشت', older: null, avestan: 'اَشَه وَهیشتَه', meaning: 'بهترین راستی' },
  { modern: 'خرداد', older: null, avestan: 'هَئوروَتات', meaning: 'رسایی و تندرستی' },
  { modern: 'تیر', older: null, avestan: 'تیشتْریَه', meaning: 'ستارهٔ تیر، شباهنگ' },
  { modern: 'مرداد', older: 'امرداد', avestan: 'اَمِرِتات', meaning: 'بی‌مرگی' },
  { modern: 'شهریور', older: null, avestan: 'خْشَثْرَه وَئیریَه', meaning: 'شهریاری آرمانی' },
  { modern: 'مهر', older: null, avestan: 'میثْرَه', meaning: 'پیمان و دوستی' },
  { modern: 'آبان', older: null, avestan: 'آپ', meaning: 'آب‌ها' },
  { modern: 'آذر', older: null, avestan: 'آتَر', meaning: 'آتش' },
  { modern: 'دی', older: null, avestan: 'دَثوش', meaning: 'آفریدگار' },
  { modern: 'بهمن', older: null, avestan: 'وُهو مَنَه', meaning: 'اندیشهٔ نیک' },
  { modern: 'اسفند', older: 'سپندارمذ', avestan: 'سْپِنتَه آرمَئیتی', meaning: 'فروتنی پاک، نگهبان زمین' },
];

/** The two names that actually change when the older forms are turned on. */
export const RENAMED = MONTH_NAMES.filter((month) => month.older !== null);

/** The month list as the visitor has asked to see it. */
export function monthNames(older: boolean): string[] {
  return MONTH_NAMES.map((month) => (older && month.older !== null ? month.older : month.modern));
}
