// ============================================================================
// Source: src/lib/events.ts
// Version: 0.14.0 — 2026-09-11
// Why: Curated occasions: national, state, lunar religious, and world.
//      Not the official calendar. Group filtering lives here so grid and list agree.
// Env / Deps: Lunar holidays from src/data/official-lunar.json for 1400–1420,
//      islamic-civil for every other year.
// ============================================================================

import { toCalendar } from './calendar';
import officialLunar from '../data/official-lunar.json';

// 'iran'      — national and cultural occasions (Nowruz, poets, Yalda, professions)
// 'state'     — occasions of the Islamic Republic and its institutions. The name «ایران»
//               is deliberately not attached to any of them, and every one of them is
//               rendered behind `StateMark`: Farjad's editorial call of 9 Sep, consistent
//               with the memorial panel, which has always named the same government.
//               The two men are named by name only — «خمینی», «خامنه‌ای» — with no
//               prefix, suffix or description: Farjad's call of 10 Sep, replacing the
//               epithets of 9 Sep. Both are under test, so no row can bring back an
//               epithet or either man's official honorific.
// 'religious' — lunar religious holidays, computed via islamic-civil
// 'world'     — international observances on the Gregorian calendar
export type EventCategory = 'iran' | 'state' | 'religious' | 'world';

export type CalendarEvent = {
  title: string;
  holiday: boolean;
  category: EventCategory;
};

// National occasions always remain visible; the other groups are independent.
export type EventGroups = { religious: boolean; state: boolean; world: boolean };
export const DEFAULT_GROUPS: EventGroups = { religious: false, state: false, world: true };
export const ALL_GROUPS: EventGroups = { religious: true, state: true, world: true };

// Shown verbatim in the UI. Preserve it: the dataset is curated, not the official calendar.
export const EVENTS_NOTICE = 'این فهرست گزیده‌ای از مناسبت‌های ثابت ایرانی و جهانی است، نه تقویم کامل رسمی. تعطیلات مذهبی قمری برای سال‌های ۱۴۰۰ تا ۱۴۲۰ از فهرست تعطیلات رسمی ایران درج شده‌اند؛ برای سال‌هایی که تقویم رسمی‌شان هنوز منتشر نشده، این تاریخ‌ها پیش‌بینی‌اند و ممکن است با اعلام رسمی (مبتنی بر رؤیت هلال) یک روز تفاوت کنند. برای سال‌های دیگر با تقویم محاسباتی islamic-civil حساب شده‌اند. مناسبت‌ها بر اساس تکرار سالانهٔ تاریخ فعلی نمایش داده می‌شوند و وضعیت تاریخی سال‌های گذشته یا تغییرات آینده را تأیید نمی‌کنند. عنوان تعطیل فقط برای تعطیلات رسمی ایران ثبت شده است؛ مناسبت جهانی به معنی تعطیلی در ایران نیست.';

// Citations for entries that were verified against a named source.
export const EVENT_SOURCES = [
  { title: 'روز همدان و بزرگداشت ابوعلی سینا، یکم شهریور — خبرگزاری آنا', url: 'https://ana.ir/fa/news/205369' },
] as const;

// Month-day → list of [title, isHoliday?] tuples.
type FixedEvents = Record<string, ReadonlyArray<readonly [title: string, holiday?: boolean]>>;

// National and cultural occasions keyed on the Persian calendar.
// Key format: `${persianMonth}-${persianDay}`; second tuple slot marks an official holiday.
const PERSIAN_EVENTS: FixedEvents = {
  '1-1': [['آغاز سال نو و عید نوروز', true]],
  '1-2': [['عید نوروز', true]],
  '1-3': [['عید نوروز', true]],
  '1-4': [['عید نوروز', true]],
  '1-13': [['روز طبیعت (سیزده‌به‌در)', true]],
  '1-25': [['روز بزرگداشت عطار نیشابوری']],
  '2-1': [['روز بزرگداشت سعدی']],
  '2-2': [['روز زمین پاک']],
  '2-10': [['روز ملی خلیج فارس']],
  '2-12': [['روز معلم']],
  '2-15': [['روز شیراز']],
  '2-25': [['روز پاسداشت زبان فارسی و بزرگداشت فردوسی']],
  '2-28': [['روز بزرگداشت حکیم عمر خیام']],
  '3-1': [['روز بزرگداشت ملاصدرا']],
  '3-20': [['روز صنایع دستی']],
  '4-1': [['روز اصناف']],
  '4-10': [['روز صنعت و معدن']],
  '4-13': [['جشن تیرگان']],
  '4-14': [['روز قلم']],
  '4-22': [['روز فناوری اطلاعات']],
  '4-25': [['روز بهزیستی و تأمین اجتماعی']],
  '5-6': [['روز ترویج آموزش‌های فنی و حرفه‌ای']],
  '5-14': [['صدور فرمان مشروطیت']],
  '5-17': [['روز خبرنگار']],
  '5-28': [['سالروز کودتای ۲۸ مرداد']],
  '6-1': [['روز پزشک و بزرگداشت ابوعلی سینا'], ['روز همدان']],
  '6-4': [['روز کارمند']],
  '6-5': [['روز داروساز و بزرگداشت محمد بن زکریای رازی']],
  '6-11': [['روز صنعت چاپ']],
  '6-12': [['روز بهورز']],
  '6-13': [['روز تعاون'], ['روز بزرگداشت ابوریحان بیرونی']],
  '6-21': [['روز ملی سینما']],
  '6-27': [['روز شعر و ادب فارسی و بزرگداشت استاد شهریار']],
  '7-1': [['آغاز سال تحصیلی']],
  '7-7': [['روز آتش‌نشانی و ایمنی']],
  '7-8': [['روز بزرگداشت مولوی']],
  '7-14': [['روز دامپزشکی']],
  '7-20': [['روز بزرگداشت حافظ']],
  '7-29': [['روز ملی صادرات']],
  '8-1': [['روز آمار و برنامه‌ریزی']],
  '8-13': [['روز دانش‌آموز']],
  '8-14': [['روز فرهنگ عمومی']],
  '8-24': [['روز کتاب، کتاب‌خوانی و کتابدار']],
  '9-16': [['روز دانشجو']],
  '9-25': [['روز پژوهش']],
  '9-30': [['شب یلدا']],
  '10-5': [['روز ایمنی در برابر زلزله و کاهش اثرات بلایای طبیعی']],
  '10-20': [['سالروز شهادت امیرکبیر']],
  '10-29': [['روز هوای پاک']],
  '12-5': [['روز مهندس و بزرگداشت خواجه نصیرالدین طوسی']],
  '12-14': [['روز احسان و نیکوکاری']],
  '12-15': [['روز درختکاری']],
  '12-25': [['روز بزرگداشت پروین اعتصامی']],
  '12-29': [['روز ملی شدن صنعت نفت ایران', true]],
};

// Occasions tied to the Islamic Republic and its institutions. Hidden unless state is enabled.
// Key format: `${persianMonth}-${persianDay}`
const STATE_EVENTS: FixedEvents = {
  '1-12': [['روز جمهوری اسلامی', true]],
  '3-3': [['سالروز آزادسازی خرمشهر؛ روز مقاومت، ایثار و پیروزی']],
  '3-14': [['رحلت خمینی', true]],
  '3-15': [['قیام پانزده خرداد', true]],
  '4-7': [['روز قوه قضائیه']],
  '6-2': [['آغاز هفته دولت']],
  '6-8': [['روز مبارزه با تروریسم؛ سالروز شهادت رجایی و باهنر']],
  '6-10': [['روز پدافند هوایی']],
  '6-17': [['سالروز قیام هفدهم شهریور']],
  '6-19': [['سالروز درگذشت آیت‌الله طالقانی']],
  '6-31': [['آغاز هفته دفاع مقدس']],
  '9-5': [['روز بسیج مستضعفین']],
  '9-7': [['روز نیروی دریایی']],
  '10-7': [['روز نهضت سوادآموزی']],
  '11-12': [['بازگشت خمینی؛ آغاز دهه فجر']],
  '11-19': [['روز نیروی هوایی']],
  '11-22': [['متأسفانه شورش ۵۷ (جمهوری اسلامی)', true]],
  // 9 Esfand 1404 is 28 February 2026, a Saturday — checked against lib/calendar, and the
  // death itself against contemporary reporting rather than memory before it was written
  // here. Not a holiday: nothing declared it one.
  '12-9': [['هلاکت خامنه‌ای']],
};

// International observances keyed on the Gregorian calendar. Never holidays in Iran.
// Key format: `${gregorianMonth}-${gregorianDay}`
const GREGORIAN_EVENTS: FixedEvents = {
  '1-1': [['سال نو میلادی']],
  '1-24': [['روز جهانی آموزش']],
  '2-4': [['روز جهانی سرطان']],
  '2-21': [['روز جهانی زبان مادری']],
  '3-8': [['روز جهانی زنان']],
  '3-20': [['روز جهانی شادی']],
  '3-21': [['روز جهانی نوروز'], ['روز جهانی شعر']],
  '3-22': [['روز جهانی آب']],
  '4-7': [['روز جهانی بهداشت']],
  '4-22': [['روز جهانی زمین']],
  '4-23': [['روز جهانی کتاب و حق مؤلف']],
  '5-1': [['روز جهانی کارگر']],
  '5-15': [['روز جهانی خانواده']],
  '5-17': [['روز جهانی مخابرات و جامعه اطلاعاتی']],
  '5-31': [['روز جهانی بدون دخانیات']],
  '6-5': [['روز جهانی محیط زیست']],
  '6-8': [['روز جهانی اقیانوس‌ها']],
  '6-14': [['روز جهانی اهدای خون']],
  '6-20': [['روز جهانی پناهندگان']],
  '6-21': [['روز جهانی یوگا']],
  '7-11': [['روز جهانی جمعیت']],
  '7-30': [['روز جهانی دوستی']],
  '8-12': [['روز جهانی جوانان']],
  '8-19': [['روز جهانی بشردوستی']],
  '9-8': [['روز جهانی سوادآموزی']],
  '9-15': [['روز جهانی دموکراسی']],
  '9-21': [['روز جهانی صلح']],
  '9-27': [['روز جهانی گردشگری']],
  '10-1': [['روز جهانی سالمندان']],
  '10-5': [['روز جهانی معلم']],
  '10-10': [['روز جهانی سلامت روان']],
  '10-16': [['روز جهانی غذا']],
  '10-24': [['روز ملل متحد']],
  '11-14': [['روز جهانی دیابت']],
  '11-20': [['روز جهانی کودک']],
  '11-25': [['روز جهانی رفع خشونت علیه زنان']],
  '12-1': [['روز جهانی ایدز']],
  '12-3': [['روز جهانی افراد دارای معلولیت']],
  '12-10': [['روز جهانی حقوق بشر']],
  '12-25': [['کریسمس']],
};

// Lunar religious holidays — computed via islamic-civil, may differ from Iranian sightings by ±1 day.
// Key format: `${islamicMonth}-${islamicDay}`
const LUNAR_HOLIDAYS: Record<string, string> = {
  '1-9': 'تاسوعا',
  '1-10': 'عاشورا',
  '2-20': 'اربعین حسینی',
  '2-28': 'رحلت پیامبر اکرم (ص) و شهادت امام حسن مجتبی (ع)',
  '2-30': 'شهادت امام رضا (ع)',
  '3-8': 'شهادت امام حسن عسکری (ع)',
  '3-17': 'میلاد پیامبر اکرم (ص) و امام جعفر صادق (ع)',
  '6-3': 'شهادت حضرت فاطمه (س)',
  '7-13': 'میلاد امام علی (ع) — روز پدر',
  '7-27': 'مبعث پیامبر اکرم (ص)',
  '8-15': 'میلاد امام مهدی (عج)',
  '9-21': 'شهادت امام علی (ع)',
  '10-1': 'عید سعید فطر',
  '10-2': 'تعطیلی عید فطر',
  // 3 Shawwal was listed here and is not an official holiday; only the first two
  // days of Fitr are. 25 Shawwal was missing and is one — both found against the
  // official list in official-lunar.json on 11 Sep.
  '10-25': 'شهادت امام جعفر صادق (ع)',
  '12-10': 'عید سعید قربان',
  '12-18': 'عید سعید غدیر خم',
};

// The official Iranian dates of the lunar holidays, 1400–1420: Persian year → Persian
// «month-day» → the Hijri «month-day» it is, which names it through LUNAR_HOLIDAYS.
// Imported from Farjad's persian_holiday.db by scripts/import-official-lunar.mjs on
// 11 Sep. For 1405 it agrees with ISNA's official list on every date the earlier
// comparison checked; years not yet published by the Calendar Centre are the
// dataset's own forecast, not an announcement.
// For a year in this table it is the ONLY lunar source: islamic-civil is not
// consulted at all, so a computed date a day off can never show up beside the real one.
const OFFICIAL_LUNAR: Record<string, Record<string, string>> = officialLunar;

// True when this day's lunar holiday comes from the official table rather than from
// islamic-civil. Only those carry no ±1 day risk, so anything that plans around a
// date — the holiday bridges — has to be able to tell the two apart.
export function hasOfficialLunarDate(date: Date): boolean {
  const persian = toCalendar(date);
  const table = OFFICIAL_LUNAR[persian.year];
  return table !== undefined && `${persian.month}-${persian.day}` in table;
}

// The Persian years the official table covers, for tests and the notice.
export const OFFICIAL_LUNAR_YEARS = Object.keys(OFFICIAL_LUNAR).map(Number);

// Returns the curated events for one civil day in Asia/Tehran.
// All groups default on so the library stays neutral; the UI passes its own setting.
export function eventsForDate(date: Date, groups: EventGroups = ALL_GROUPS): CalendarEvent[] {
  const persian = toCalendar(date);
  const gregorian = toCalendar(date, 'gregorian');
  const islamic = toCalendar(date, 'islamic');
  const iran = PERSIAN_EVENTS[`${persian.month}-${persian.day}`] ?? [];
  const state = STATE_EVENTS[`${persian.month}-${persian.day}`] ?? [];
  const world = GREGORIAN_EVENTS[`${gregorian.month}-${gregorian.day}`] ?? [];
  // A year in the official table takes its lunar holidays from it alone; any other
  // year computes them with islamic-civil.
  const table = OFFICIAL_LUNAR[persian.year];
  const hijriKey = table ? table[`${persian.month}-${persian.day}`] : `${islamic.month}-${islamic.day}`;
  const religiousTitle = hijriKey ? LUNAR_HOLIDAYS[hijriKey] : undefined;
  // Order matters for display: national first, then state, then religious, then world.
  // Hidden groups contribute no rows or holiday flags, keeping list and shading consistent.
  return [
    ...iran.map(([title, holiday = false]): CalendarEvent => ({ title, holiday, category: 'iran' })),
    ...(groups.state ? state.map(([title, holiday = false]): CalendarEvent => ({ title, holiday, category: 'state' })) : []),
    ...(groups.religious && religiousTitle ? [{ title: religiousTitle, holiday: true, category: 'religious' as const }] : []),
    ...(groups.world ? world.map(([title]): CalendarEvent => ({ title, holiday: false, category: 'world' })) : []),
  ];
}
