// ============================================================================
// Source: src/lib/changelog.ts
// Version: 0.10.0 — 2026-09-09
// Why: The release history and the shortlist of what is being considered next,
//      as data. Rendered by /changelog; nothing else reads it.
//      WRITTEN FOR VISITORS, NOT FOR US. Work that changes nothing a visitor can
//      see gets no entry here — build scripts, linters, test suites, manifests,
//      canonical tags, sitemaps. The one exception is a fix: if it was a bug they
//      could run into, it is theirs to read about, however technical the cause.
//      Releases whose only content was internal bookkeeping are not listed at all,
//      which is why 0.8.1, 0.9.12 and 0.9.13 are absent. Each entry is ONE short
//      sentence: the page is read on a phone, and a paragraph per change turned
//      it into a scroll nobody finished (Farjad, 9 Sep). The reasoning behind a
//      change belongs in AGENTS.md, not here.
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
    version: '0.9.21',
    at: '2026-09-09T20:10:00-04:00',
    status: 'ready',
    title: 'تصویر امروز',
    changes: [
      { kind: 'added', text: 'دکمهٔ «تصویر امروز» بالای صفحه: از روزی که می‌بینی یک تصویر می‌سازد تا بفرستی یا ذخیره کنی.' },
      { kind: 'added', text: 'هر شش زبانهٔ ابزارها یک خط توضیح گرفتند.' },
      { kind: 'fixed', text: 'در «تاریخ‌های من» ارقام فارسی پذیرفته نمی‌شد و تاریخ درست هم رد می‌شد.' },
      { kind: 'changed', text: 'همین صفحه کوتاه شد: هر تغییر یک جمله، و نسخه‌های قدیمی‌تر یک کلیک پایین‌تر.' },
    ],
  },
  {
    version: '0.9.20',
    at: '2026-09-09T19:15:00-04:00',
    status: 'live',
    title: 'تاریخ‌های من، در ابزارها',
    changes: [
      { kind: 'fixed', text: '«تاریخ‌های من» عملاً پیدا نمی‌شد؛ حالا یکی از زبانه‌های ابزارهای تاریخ است.' },
      { kind: 'added', text: 'هر زبانهٔ ابزارها نشانی خودش را دارد، مثل «taghv.im/#dates».' },
    ],
  },
  {
    version: '0.9.19',
    at: '2026-09-09T18:30:00-04:00',
    status: 'live',
    title: 'حروف نام‌های یادبود',
    changes: [
      { kind: 'fixed', text: 'بعضی نام‌های بخش یادبود با حروف عربی نوشته شده بودند و درست نمایش داده نمی‌شدند.' },
    ],
  },
  {
    version: '0.9.18',
    at: '2026-09-09T17:40:00-04:00',
    status: 'live',
    title: 'نهم اسفند',
    changes: [
      { kind: 'added', text: 'نهم اسفند اضافه شد: هلاکت ضحاک تاریخ (خامنه‌ای) در ثانیهٔ صفر جنگ. در دستهٔ «دولتی» است و پیش‌فرض نمایش داده نمی‌شود.' },
    ],
  },
  {
    version: '0.9.17',
    at: '2026-09-09T16:20:00-04:00',
    status: 'live',
    title: 'تاریخ‌های من',
    changes: [
      { kind: 'added', text: 'تولدها و سالگردها را به تاریخ شمسی نگه دار؛ روی تقویم نقطه می‌گیرند و خروجی‌شان به تقویم گوگل و اپل می‌رود.' },
      { kind: 'added', text: 'این فهرست فقط در مرورگر خودت می‌ماند و به جایی فرستاده نمی‌شود.' },
      { kind: 'changed', text: 'مناسبت‌های دستهٔ «دولتی» بازنویسی شدند و نام ایران را با خود ندارند. این دسته مثل قبل پیش‌فرض خاموش است.' },
    ],
  },
  {
    version: '0.9.16',
    at: '2026-09-09T11:45:00-04:00',
    status: 'live',
    title: 'تعطیلات پیوسته و روزشمار',
    changes: [
      { kind: 'added', text: 'با یکی دو روز مرخصی چند روز تعطیلی پیوسته می‌گیری؟ زبانهٔ «تعطیلات پیوسته» همین را نشان می‌دهد.' },
      { kind: 'added', text: 'زبانهٔ «روزشمار»: چند روز تا مناسبت بعدی، تا نوروز و تا یلدا.' },
      { kind: 'added', text: 'صفحهٔ تعطیلات پیوسته با سال‌نما: دوازده ماه در یک نگاه.' },
    ],
  },
  {
    version: '0.9.15',
    at: '2026-09-09T10:35:00-04:00',
    status: 'live',
    title: 'افزونهٔ فایرفاکس',
    changes: [
      { kind: 'added', text: 'همان افزونه برای فایرفاکس ساخته و برای انتشار فرستاده شد. روی فایرفاکس ۱۴۰ به بعد نصب می‌شود.' },
    ],
  },
  {
    version: '0.9.14',
    at: '2026-09-09T10:10:00-04:00',
    status: 'live',
    title: 'انتشار افزونه، و راهی برای گزارش',
    changes: [
      { kind: 'added', text: 'افزونهٔ کروم در فروشگاه منتشر شد و صفحهٔ «دریافت تقویم» دکمهٔ نصب دارد.' },
      { kind: 'added', text: 'بخش «گزارش اشکال یا پیشنهاد»: دو دکمه که برنامهٔ ایمیلت را با سؤال‌های آماده باز می‌کنند.' },
    ],
  },
  {
    version: '0.9.11',
    at: '2026-09-08T19:20:00-04:00',
    status: 'live',
    title: 'صفحهٔ دریافت',
    changes: [
      { kind: 'added', text: 'صفحهٔ «دریافت تقویم»: راه‌های داشتن تقویم روی دستگاهت، هر کدام با وضعیت واقعی‌اش.' },
    ],
  },
  {
    version: '0.9.10',
    at: '2026-09-08T18:10:00-04:00',
    status: 'live',
    title: 'صفحهٔ حریم خصوصی',
    changes: [
      { kind: 'added', text: 'بخش «حریم خصوصی»: چه چیزی در مرورگرت ذخیره می‌شود و چه چیزی از بیرون بارگذاری می‌شود.' },
      { kind: 'fixed', text: 'نوشته بودیم هیچ درخواستی به بیرون نمی‌رود، در حالی که عکس بخش یادبود از سرویس منبع می‌آید.' },
    ],
  },
  {
    version: '0.9.9',
    at: '2026-09-08T17:30:00-04:00',
    status: 'live',
    title: 'آیکن افزونه در نوار ابزار',
    changes: [
      { kind: 'fixed', text: 'آیکن افزونه در نوار ابزار محو دیده می‌شد.' },
    ],
  },
  {
    version: '0.9.8',
    at: '2026-09-08T17:00:00-04:00',
    status: 'live',
    title: 'افزونهٔ کروم: تب جدید، تقویم',
    changes: [
      { kind: 'added', text: 'افزونه‌ای که تب جدید را با تقویم جایگزین می‌کند، بدون هیچ مجوزی و بدون هیچ درخواستی به اینترنت.' },
    ],
  },
  {
    version: '0.9.7',
    at: '2026-09-08T15:10:00-04:00',
    status: 'live',
    title: 'پیش‌نمایش درست برای هر صفحه',
    changes: [
      { kind: 'fixed', text: 'فرستادن نشانی «راهنما» یا «تغییرات» عنوان صفحهٔ اصلی را نشان می‌داد.' },
    ],
  },
  {
    version: '0.9.6',
    at: '2026-09-08T14:30:00-04:00',
    status: 'live',
    title: 'تصویر پیش‌نمایش برای اشتراک‌گذاری',
    changes: [
      { kind: 'added', text: 'فرستادن نشانی سایت در تلگرام یا واتساپ، به‌جای لینک خشک، کارت پیش‌نمایش نشان می‌دهد.' },
    ],
  },
  {
    version: '0.9.5',
    at: '2026-09-08T14:10:00-04:00',
    status: 'live',
    title: 'صفحهٔ راهنما، و پاورقی کوتاه‌تر',
    changes: [
      { kind: 'added', text: 'صفحهٔ «راهنما»: مرحله‌به‌مرحله برای هر کاری که در تقویم می‌شود کرد.' },
      { kind: 'changed', text: 'پاورقی از چهارده پیوند به نُه رسید.' },
    ],
  },
  {
    version: '0.9.4',
    at: '2026-09-08T13:45:00-04:00',
    status: 'live',
    title: 'افزودن به تقویم گوگل و اپل',
    changes: [
      { kind: 'added', text: 'یک نشانی اشتراکی که مناسبت‌های ملی و فرهنگی را داخل تقویم خودت می‌آورد و خودش تازه می‌شود.' },
      { kind: 'changed', text: 'تعطیلات قمری در این فهرست نیست، چون تاریخشان بر پایهٔ رؤیت هلال است.' },
    ],
  },
  {
    version: '0.9.3',
    at: '2026-09-08T13:35:00-04:00',
    status: 'live',
    title: 'ایران‌سنس و ایران‌یکان',
    changes: [
      { kind: 'added', text: 'دو قلم تازه؛ حالا پنج قلم فارسی هست و هر کدام فقط با انتخاب خودت دانلود می‌شود.' },
      { kind: 'fixed', text: 'قلم انتخابی‌ات دیگر یک لحظه دیر نمی‌رسد.' },
    ],
  },
  {
    version: '0.9.2',
    at: '2026-09-08T13:20:00-04:00',
    status: 'live',
    title: 'تقویم، اول صفحه در موبایل',
    changes: [
      { kind: 'changed', text: 'در گوشی تقویم بالای صفحه می‌آید؛ پیش‌تر باید بیشتر از یک صفحه اسکرول می‌کردی.' },
    ],
  },
  {
    version: '0.9.1',
    at: '2026-09-08T11:40:00-04:00',
    status: 'live',
    title: 'نصب روی صفحهٔ خانه',
    changes: [
      { kind: 'added', text: 'تقویم را می‌شود به صفحهٔ خانهٔ گوشی اضافه کرد؛ با آیکن خودش و بدون نوار مرورگر.' },
    ],
  },
  {
    version: '0.9.0',
    at: '2026-09-08T01:37:48-04:00',
    status: 'live',
    title: 'نمایش مستقل مناسبت‌ها',
    changes: [
      { kind: 'added', text: 'چهار کلید مستقل مذهبی، دولتی، جهانی و یادبود زیر تقویم. ملی و فرهنگی همیشه نمایش داده می‌شود.' },
      { kind: 'fixed', text: 'خاموش‌کردن یک دسته، رنگ تعطیلی‌اش را هم برمی‌دارد، تا هیچ روزی رنگی نماند که دلیلش پیدا نباشد.' },
    ],
  },
  {
    version: '0.8.0',
    at: '2026-09-07T02:09:58-04:00',
    status: 'live',
    title: 'برج فلکی',
    changes: [
      { kind: 'added', text: 'برج فلکی هر روز، با نشان کشیده‌شدهٔ خودش.' },
    ],
  },
  {
    version: '0.7.0',
    at: '2026-09-07T01:37:02-04:00',
    status: 'live',
    title: 'ساعت شهرهای دیگر',
    changes: [
      { kind: 'added', text: 'ساعت خودت وقتی منطقهٔ زمانی‌ات با تهران فرق دارد، به‌علاوهٔ تا دو شهر دلخواه.' },
    ],
  },
  {
    version: '0.6.0',
    at: '2026-09-07T01:17:44-04:00',
    status: 'live',
    title: 'پاک‌سازی متن‌ها',
    changes: [
      { kind: 'changed', text: 'متن‌های تزئینی صفحهٔ اصلی برداشته شدند؛ صفحه با تاریخ امروز شروع می‌شود.' },
      { kind: 'fixed', text: 'صفحهٔ «درباره» می‌گفت فقط شهر ذخیره می‌شود، در حالی که پنج تنظیم ذخیره می‌شد.' },
    ],
  },
  {
    version: '0.4.0',
    at: '2026-09-07T00:52:46-04:00',
    status: 'live',
    title: 'پوسته و قلم به انتخاب تو',
    changes: [
      { kind: 'added', text: 'حالت تیره، سه اندازهٔ قلم، و انتخاب قلم بین سه قلم فارسی.' },
    ],
  },
  {
    version: '0.3.0',
    at: '2026-09-07T00:36:41-04:00',
    status: 'live',
    title: 'یادبود جاویدنامان',
    changes: [
      { kind: 'added', text: 'در هر بار باز کردن صفحه، نام و عکس یکی از جان‌باختگان ۱۸ و ۱۹ دی.' },
    ],
  },
  {
    version: '0.2.0',
    at: '2026-09-07T00:23:52-04:00',
    status: 'live',
    title: 'پیش‌فرض ایران عزیز',
    changes: [
      { kind: 'changed', text: 'مناسبت‌های مذهبی و دولتی پیش‌فرض نمایش داده نمی‌شوند و انتخاب تو ذخیره می‌شود.' },
    ],
  },
  {
    version: '0.1.0',
    at: '2026-09-06T18:11:41-04:00',
    status: 'live',
    title: 'اولین انتشار',
    changes: [
      { kind: 'added', text: 'تقویم ماهانهٔ شمسی، ساعت زندهٔ تهران، و تاریخ امروز در سه تقویم.' },
      { kind: 'added', text: 'تبدیل تاریخ، فاصلهٔ دو تاریخ، محاسبهٔ سن، و اوقات شرعی ۱۲ شهر.' },
    ],
  },
];

// Under consideration — deliberately without dates or promises.
// Written for visitors, not as internal strategy: what is being considered,
// in plain terms, with the honest caveats attached. Order carries no meaning.
export const UPCOMING: string[] = [
  'کارکرد آفلاین، تا تقویم بدون اینترنت هم باز شود. نصب روی صفحهٔ خانهٔ گوشی از نسخهٔ ۰.۹.۱ کار می‌کند و راهنمایش هست، ولی برای دیدن تقویم هنوز به اینترنت نیاز داری.',
  'ربات تلگرام که هر روز صبح تاریخ و مناسبت‌های آن روز را بفرستد.',
  'تصویر زمینهٔ ماهانه برای موبایل، تا تقویم روی صفحهٔ قفل باشد.',
  'افزودن تعطیلات قمری به فهرست اشتراکی تقویم. نیمهٔ شمسی‌اش ساخته شد؛ این نیمه تا وقتی تاریخ‌های قمری بر پایهٔ تقویم رسمی درنیامده، اضافه نمی‌شود.',
  'تعطیلات قمری بر پایهٔ تقویم رسمی، نه محاسباتی — امروز فقط سه تاریخ از سال ۱۴۰۵ تثبیت شده است.',
  'برنامهٔ اندروید و ویجت صفحهٔ اصلی. ویجت بدون برنامهٔ نصبی ممکن نیست، و چون اپ‌استور اپل در ایران در دسترس نیست، اگر ساخته شود اول اندروید خواهد بود.',
];

export const UPCOMING_NOTICE = 'این فهرست، کارهایی است که در دست بررسی‌اند؛ نه قول، نه زمان‌بندی. ترتیب هم معنایی ندارد.';
