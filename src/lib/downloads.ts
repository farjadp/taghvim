// ============================================================================
// Source: src/lib/downloads.ts
// Version: 0.9.12 — 2026-09-08
// Why: The ways to get the calendar onto a device, and the honest status of
//      each. Kept as data so /download cannot claim something that is not
//      built: a method with no `href` renders no button, and the Chrome
//      listing appears only once CHROME_STORE_URL stops being null.
// Env / Deps: None. When the Web Store approves the extension, set
//      CHROME_STORE_URL and nothing else needs editing.
// ============================================================================

// Set this the day the Chrome Web Store approves the listing. Until then the
// page says it is in review and offers the build-it-yourself route instead.
export const CHROME_STORE_URL: string | null = null;

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
    status: 'review',
    summary:
      'هر تب جدیدی که باز می‌کنی تقویم باشد: تاریخ امروز و ساعت تهران، ماه جاری و مناسبت‌های روز. هیچ مجوزی نمی‌خواهد و هیچ درخواستی به اینترنت نمی‌فرستد.',
    steps: [
      'برای انتشار در فروشگاه کروم فرستاده شده و منتظر بازبینی گوگل است.',
      'تا آن موقع می‌شود از روی کد پروژه ساختش: مخزن را بگیر، «npm run build:extension» را بزن، و در chrome://extensions با «Load unpacked» پوشهٔ extension/dist را انتخاب کن.',
    ],
    action: { label: 'کد پروژه در گیت‌هاب', href: 'https://github.com/farjadp/taghvim', external: true },
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
