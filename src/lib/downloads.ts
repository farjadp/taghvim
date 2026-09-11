// ============================================================================
// Source: src/lib/downloads.ts
// Version: 0.9.30 — 2026-09-10
// Why: The ways to get the calendar onto a device, and the honest status of
//      each. Kept as data so /download cannot claim something that is not
//      built: a method with no `href` renders no button, and a store listing
//      appears only once its URL constant stops being null.
// Env / Deps: None. Each extension's status, steps and button are derived
//      from its store URL, so approval is one edit and nothing else in this
//      file or on the page needs touching.
// ============================================================================

// Set this the day the Chrome Web Store approves the listing. Until then the
// page says it is in review and offers the build-it-yourself route instead.
// Approved and published 9 Sep 2026; item id fklcgaapfagcichjeonihhbkcfggim.
export const CHROME_STORE_URL: string | null =
  'https://chromewebstore.google.com/detail/%D8%AA%D9%82%D9%88%DB%8C%D9%85/idfklcgaapfagcichjeonihhbkcfggim';

// Set this the day addons.mozilla.org approves the listing. Submitted 9 Sep
// 2026; until it is approved the card says so, exactly as Chrome's did.
export const FIREFOX_STORE_URL: string | null = null;

export type DownloadStatus = 'ready' | 'review' | 'building' | 'planned';

export type DownloadMethod = {
  id: string;
  title: string;
  status: DownloadStatus;
  summary: string;
  steps: readonly string[];
  note?: string;
  action?: { label: string; href: string; external?: boolean };
};

export const STATUS_LABELS: Record<DownloadStatus, string> = {
  ready: 'آماده',
  review: 'در حال بازبینی',
  building: 'در دست ساخت',
  planned: 'هنوز ساخته نشده',
};

export const DOWNLOAD_METHODS: readonly DownloadMethod[] = [
  {
    id: 'home-screen',
    title: 'روی صفحهٔ خانهٔ گوشی',
    status: 'ready',
    summary:
      'تقویم را مثل یک برنامه به صفحهٔ خانه اضافه کن. آیکن خودش را دارد و بدون نوار مرورگر باز می‌شود. نه فروشگاهی، نه نصبی، نه حسابی.',
    steps: [
      'در آی‌فون: سایت را در Safari باز کن، دکمهٔ اشتراک‌گذاری را بزن و «Add to Home Screen» را انتخاب کن.',
      'در اندروید: در Chrome منوی سه‌نقطه را باز کن و «Add to Home screen» یا «Install app» را بزن.',
    ],
    note: 'برای دیدن تقویم هنوز به اینترنت نیاز داری؛ کارکرد آفلاین هنوز ساخته نشده است.',
    action: { label: 'باز کردن تقویم', href: '/' },
  },
  {
    id: 'chrome',
    title: 'افزونهٔ کروم — تب جدید',
    // Everything below hangs off CHROME_STORE_URL: while it is null the card
    // says the listing is in review and points at the source, and the moment
    // it holds a URL the same card becomes a store button.
    status: CHROME_STORE_URL ? 'ready' : 'review',
    summary:
      'هر تب جدیدی که باز می‌کنی تقویم باشد: تاریخ امروز و ساعت تهران، ماه جاری و مناسبت‌های روز. هیچ مجوزی نمی‌خواهد و هیچ درخواستی به اینترنت نمی‌فرستد.',
    steps: CHROME_STORE_URL
      ? [
          'در فروشگاه کروم منتشر شده است: صفحه‌اش را باز کن و «Add to Chrome» را بزن.',
          'بعد از نصب، هر تب جدید تقویم را نشان می‌دهد. برای برگشتن به تب جدید کروم، افزونه را از chrome://extensions خاموش کن.',
        ]
      : [
          'برای انتشار در فروشگاه کروم فرستاده شده و منتظر بازبینی گوگل است.',
          'تا آن موقع می‌شود از روی کد پروژه ساختش: مخزن را بگیر، «npm run build:extension» را بزن، و در chrome://extensions با «Load unpacked» پوشهٔ extension/dist را انتخاب کن.',
        ],
    note: CHROME_STORE_URL
      ? 'تنظیم‌های افزونه از سایت جدا است: صفحهٔ افزونه دامنهٔ خودش را دارد، پس تم و قلمی که در سایت انتخاب کرده‌ای آنجا اعمال نمی‌شود.'
      : undefined,
    action: CHROME_STORE_URL
      ? { label: 'نصب از فروشگاه کروم', href: CHROME_STORE_URL, external: true }
      : { label: 'کد پروژه در گیت‌هاب', href: 'https://github.com/farjadp/taghvim', external: true },
  },
  {
    id: 'firefox',
    title: 'افزونهٔ فایرفاکس — تب جدید',
    // Same shape as the Chrome card: everything hangs off the store URL, so
    // approval is one edit and nothing else here or on the page moves.
    status: FIREFOX_STORE_URL ? 'ready' : 'review',
    summary:
      'همان افزونه، همان کد، برای فایرفاکس: تاریخ امروز و ساعت تهران، ماه جاری و مناسبت‌های روز در هر تب جدید. مثل نسخهٔ کروم هیچ مجوزی نمی‌خواهد و هیچ درخواستی به اینترنت نمی‌فرستد.',
    steps: FIREFOX_STORE_URL
      ? [
          'صفحه‌اش را در فروشگاه افزونه‌های فایرفاکس باز کن و «Add to Firefox» را بزن.',
          'فایرفاکس یک بار می‌پرسد که اجازه می‌دهی تب جدید عوض شود؛ باید تأیید کنی. این پرسش را خودِ مرورگر می‌پرسد و نمی‌شود دورش زد.',
        ]
      : [
          'برای انتشار در فروشگاه افزونه‌های فایرفاکس فرستاده شده و منتظر بازبینی موزیلا است.',
          'تا آن موقع می‌شود از روی کد پروژه ساختش: مخزن را بگیر، «npm run build:extension:firefox» را بزن، و در about:debugging گزینهٔ «Load Temporary Add-on» را روی پوشهٔ extension/dist-firefox بگذار.',
        ],
    note: FIREFOX_STORE_URL
      ? 'فایرفاکس ۱۴۰ به بالا لازم است. روی فایرفاکس اندروید کار نمی‌کند، چون آنجا جایگزینی تب جدید پشتیبانی نمی‌شود.'
      : 'افزونهٔ موقت با بستن فایرفاکس پاک می‌شود؛ این راه برای امتحان کردن است، نه برای هر روز.',
    action: FIREFOX_STORE_URL
      ? { label: 'نصب از فروشگاه فایرفاکس', href: FIREFOX_STORE_URL, external: true }
      : { label: 'کد پروژه در گیت‌هاب', href: 'https://github.com/farjadp/taghvim', external: true },
  },
  {
    id: 'calendar-feed',
    title: 'داخل تقویم گوگل و اپل',
    status: 'ready',
    summary:
      'یک نشانی را یک بار اضافه می‌کنی و مناسبت‌های ایرانی داخل همان تقویمی می‌آیند که هر روز باز می‌کنی. بعد از آن خودِ تقویم فهرست را تازه نگه می‌دارد.',
    steps: [
      'در تقویم گوگل: «تقویم‌های دیگر» ← «از طریق نشانی وب».',
      'در آی‌فون: تنظیمات ← برنامه‌ها ← تقویم ← حساب‌ها ← افزودن حساب ← دیگر ← افزودن تقویم اشتراکی.',
    ],
    note: 'تعطیلات مذهبی قمری در این فهرست نیست، چون تاریخشان بر پایهٔ رؤیت هلال تعیین می‌شود.',
    action: { label: 'مراحل کامل در راهنما', href: '/help#subscribe' },
  },
] as const;

// Set this the day Farjad approves publishing the GitHub release android-v1.0.
// Until then the Android card says «در دست ساخت» and offers no button — the same
// rule CHROME_STORE_URL follows. A fixed per-version URL on purpose, never
// releases/latest: any later release of anything else would silently repoint
// «latest», and this page would hand out the wrong file.
export const ANDROID_APK_URL: string | null = null;

// The certificate every Taghvim APK is signed with (subject CN=Taghvim), so
// anyone handed the file somewhere else can check it came from here. It is
// public by nature — it is inside every APK — and it changes only if the key
// does, which it must not: an APK signed with another key cannot update an
// install signed with this one.
export const ANDROID_CERT_SHA256 =
  '2A:21:28:8E:2B:A9:A8:13:C2:19:84:83:D8:29:2D:9D:03:94:7D:19:C3:D8:71:7E:42:DA:8E:CF:6C:7B:68:6E';

export type AppPlatform = {
  id: 'android' | 'ios';
  name: string;
  status: DownloadStatus;
  points: readonly string[];
  action?: { label: string; href: string; external: true };
  fingerprint?: string;
};

// The two apps, shown on /download as their own panel rather than one more card:
// they are what most people asked for, and the widgets are why. Built from the
// APK URL so the page cannot claim a download that does not exist, and so both
// states are testable without flipping the constant. Nothing names an iPhone
// date — there is none yet.
export function appsPanel(apkUrl: string | null) {
  const android = apkUrl !== null;
  const platforms: AppPlatform[] = [
    android
      ? {
          id: 'android',
          name: 'اندروید',
          status: 'ready',
          points: [
            'ویجت صفحهٔ خانه، در اندازهٔ کوچک و پهن',
            'اندروید ۷ یا بالاتر، بدون مجوز اینترنت',
            'اندروید یک بار می‌پرسد اجازه می‌دهی مرورگر برنامه نصب کند؛ باید تأیید کنی.',
          ],
          action: { label: 'دریافت فایل نصبی (APK)', href: apkUrl, external: true },
          fingerprint: ANDROID_CERT_SHA256,
        }
      : { id: 'android', name: 'اندروید', status: 'building', points: ['ویجت صفحهٔ خانه، در اندازهٔ کوچک و پهن'] },
    { id: 'ios', name: 'آیفون', status: 'building', points: ['ویجت صفحهٔ خانه و صفحهٔ قفل'] },
  ];
  return {
    title: 'برنامهٔ اندروید و آیفون',
    summary: android
      ? 'برنامهٔ اندروید آماده است: همان تقویم، به‌علاوهٔ ویجت روی صفحهٔ خانه. نسخهٔ آیفون، با ویجت صفحهٔ قفل، در دست ساخت است.'
      : 'هر دو برنامه در دست کدنویسی‌اند. همان تقویم، به‌علاوهٔ چیزی که فقط یک برنامهٔ نصبی می‌تواند داشته باشد: ویجت روی صفحهٔ خانه و صفحهٔ قفل.',
    platforms,
    note: 'اپ‌استور اپل از داخل ایران در دسترس نیست.',
    timing: android
      ? 'زمان انتشار نسخهٔ آیفون هنوز معلوم نیست. هر خبری اول همین‌جا و در صفحهٔ تغییرات نوشته می‌شود.'
      : 'زمان انتشار هنوز معلوم نیست. هر خبری اول همین‌جا و در صفحهٔ تغییرات نوشته می‌شود.',
  };
}

export const APPS = appsPanel(ANDROID_APK_URL);

// What each widget holds. The page draws them with a fixed date — Nowruz 1406,
// labelled as an example — so a static page never shows a stale «today».
export const WIDGETS = [
  { id: 'small', name: 'کوچک', size: '۱×۱', on: 'اندروید و آیفون', shows: 'روز هفته، روز و ماه' },
  { id: 'wide', name: 'پهن', size: '۴×۱', on: 'اندروید', shows: 'تاریخ کامل، روز هفته و مناسبت' },
  { id: 'lock', name: 'صفحهٔ قفل', size: null, on: 'آیفون', shows: 'تاریخ و مناسبت، زیر ساعت' },
] as const;
