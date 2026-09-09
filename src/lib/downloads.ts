// ============================================================================
// Source: src/lib/downloads.ts
// Version: 0.9.16 — 2026-09-09
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

export type DownloadStatus = 'ready' | 'review' | 'planned';

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
  {
    id: 'android',
    title: 'برنامهٔ اندروید و ویجت',
    status: 'planned',
    summary:
      'ویجت صفحهٔ خانه پرتکرارترین چیزی است که خواسته شده. ویجت بدون برنامهٔ نصبی ممکن نیست، پس اگر ساخته شود اول اندروید خواهد بود — اپ‌استور اپل در ایران در دسترس نیست.',
    steps: [
      'هنوز شروع نشده. اگر ساخته شود، در همین صفحه و در فهرست تغییرات نوشته می‌شود.',
    ],
    action: { label: 'آنچه در دست بررسی است', href: '/changelog#upcoming' },
  },
] as const;
