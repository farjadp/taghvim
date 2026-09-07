// ============================================================================
// Source: src/lib/changelog.ts
// Version: 0.6.0 — 2026-09-07
// Why: The release history and the shortlist of what is being considered next,
//      as data. Rendered by /changelog; nothing else reads it.
// Env / Deps: Instants are ISO strings with a real offset and are displayed as
//      Tehran civil time via lib/calendar, like every other date in the app.
// ============================================================================

// 'added' — something new, 'changed' — different behaviour, 'fixed' — a bug
export type ChangeKind = 'added' | 'changed' | 'fixed';

export type Release = {
  version: string;
  // Commit instant of the release, ISO 8601 with offset
  at: string;
  // 'live' is on taghv.im; 'ready' is committed and tested but not deployed yet
  status: 'live' | 'ready';
  title: string;
  changes: { kind: ChangeKind; text: string }[];
};

export const CHANGE_LABELS: Record<ChangeKind, string> = {
  added: 'تازه',
  changed: 'تغییر',
  fixed: 'رفع اشکال',
};

// Newest first. Add a release here in the same commit that ships it.
export const RELEASES: Release[] = [
  {
    version: '0.6.0',
    at: '2026-09-07T01:17:44-04:00',
    status: 'ready',
    title: 'پاک‌سازی متن‌ها',
    changes: [
      { kind: 'changed', text: 'متن‌های تزئینی صفحهٔ اصلی برداشته شدند: خوشامد بالای صفحه، جملهٔ انگیزشی زیر تاریخ، و نوار پایانی. صفحه با تاریخ امروز شروع می‌شود.' },
      { kind: 'changed', text: 'توضیح ابزار تبدیل تاریخ و صفحهٔ «درباره» بازنویسی شدند تا به‌جای تعریف از خود، بگویند چه کاری انجام می‌شود.' },
      { kind: 'fixed', text: 'صفحهٔ «درباره» می‌گفت فقط شهر در مرورگر ذخیره می‌شود؛ از نسخهٔ ۰.۴.۰ پنج تنظیم ذخیره می‌شود. همچنین فقط وزیرمتن را نام می‌برد.' },
    ],
  },
  {
    version: '0.5.0',
    at: '2026-09-07T00:59:07-04:00',
    status: 'live',
    title: 'همین صفحه',
    changes: [
      { kind: 'added', text: 'صفحهٔ «تغییرات»: فهرست نسخه‌ها با تاریخ و ساعت، و کارهایی که در دست بررسی‌اند.' },
    ],
  },
  {
    version: '0.4.0',
    at: '2026-09-07T00:52:46-04:00',
    status: 'live',
    title: 'پوسته و قلم به انتخاب تو',
    changes: [
      { kind: 'added', text: 'حالت تیره، با سه گزینهٔ خودکار، روشن و تیره. «خودکار» از تنظیمات دستگاه پیروی می‌کند.' },
      { kind: 'added', text: 'اندازهٔ قلم در سه اندازه؛ کل صفحه بزرگ و کوچک می‌شود، نه فقط متن‌ها.' },
      { kind: 'added', text: 'انتخاب قلم بین وزیرمتن، شبنم و ساحل. هر سه روی همین سرور میزبانی می‌شوند.' },
      { kind: 'changed', text: 'باکس جاویدنامان تیره شد و شمارندهٔ تعداد نام‌ها از آن برداشته شد.' },
    ],
  },
  {
    version: '0.3.0',
    at: '2026-09-07T00:36:41-04:00',
    status: 'live',
    title: 'یادبود جاویدنامان',
    changes: [
      { kind: 'added', text: 'باکس یادبود جاویدنامان انقلاب ملی ایرانیان: در هر بار باز کردن صفحه، نام و عکس یک نفر، با پیوند به صفحهٔ او در فهرست منبع.' },
      { kind: 'changed', text: 'اوقات شرعی به زیر این باکس منتقل شد و فقط با روشن‌کردن کلید مناسبت‌ها نمایش داده می‌شود.' },
    ],
  },
  {
    version: '0.2.0',
    at: '2026-09-07T00:23:52-04:00',
    status: 'live',
    title: 'پیش‌فرض سکولار',
    changes: [
      { kind: 'changed', text: 'مناسبت‌های مذهبی و دولتی به‌صورت پیش‌فرض نمایش داده نمی‌شوند. یک کلید در نوار بالا آن‌ها را برمی‌گرداند و انتخاب تو ذخیره می‌شود.' },
      { kind: 'fixed', text: 'تاریخ قمری به هر خانهٔ تقویم اضافه شد و عدد میلادی کمی بزرگ‌تر شد.' },
    ],
  },
  {
    version: '0.1.0',
    at: '2026-09-06T18:11:41-04:00',
    status: 'live',
    title: 'اولین انتشار',
    changes: [
      { kind: 'added', text: 'تقویم ماهانهٔ شمسی با شروع هفته از شنبه، ساعت زندهٔ تهران، و تاریخ امروز در سه تقویم.' },
      { kind: 'added', text: 'تبدیل تاریخ، فاصلهٔ دو تاریخ و محاسبهٔ سن.' },
      { kind: 'added', text: 'اوقات شرعی برای ۱۲ شهر ایران.' },
      { kind: 'added', text: 'مناسبت‌ها و تعطیلات رسمی، با تعطیلات قمری محاسباتی.' },
      { kind: 'added', text: 'صفحه‌های «درباره ما» و «تماس با ما».' },
    ],
  },
];

// Under consideration — deliberately without dates or promises.
export const UPCOMING: string[] = [
  'ویجت صفحهٔ اصلی برای موبایل، تا تاریخ بدون باز کردن سایت دیده شود.',
  'افزونهٔ کروم، با همین طراحی.',
  'گزینه‌ای برای اینکه ساعت دستگاه خودت اصل باشد و ساعت ایران کنارش.',
  'تعطیلات قمری بر پایهٔ تقویم رسمی، نه محاسباتی — امروز فقط سه تاریخ از سال ۱۴۰۵ تثبیت شده است.',
];

export const UPCOMING_NOTICE = 'این فهرست، کارهایی است که در دست بررسی‌اند؛ نه قول، نه زمان‌بندی. ترتیب هم معنایی ندارد.';
