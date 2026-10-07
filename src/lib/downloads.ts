// ============================================================================
// Source: src/lib/downloads.ts
// Version: 0.9.43 — 2026-10-07
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
// 2026 and public by 12 Sep (AMO API: status «public», 0.9.38) — but this stayed
// null until 3 Oct, so /download told visitors for three weeks that a live
// add-on was still in review. Locale-free on purpose: AMO redirects to the
// visitor's own language.
export const FIREFOX_STORE_URL: string | null =
  'https://addons.mozilla.org/firefox/addon/%D8%AA%D9%82%D9%88%DB%8C%D9%85/';

// Set this the day the iPhone app is RELEASED on the App Store — not the day
// it is approved: Farjad releases by hand, and until he does the listing does
// not exist for anyone else. App Review approved 1.0 (2) on 7 Oct 2026; the id
// is the app's Apple ID in App Store Connect. Locale-free: Apple sends the
// visitor to their own storefront.
export const APP_STORE_URL: string | null = 'https://apps.apple.com/app/id6819758617';

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
// 1.0 and 1.1 (11 Sep 2026) were built locally. 1.2 (versionCode 3, same key, same
// content as 1.1) is the first built by the release workflow: the unsigned APK in
// release v0.9.39 is attested, and the signed one differs from it only by the
// signature (scripts/sign-release-apk.mjs; VERIFY.md says how anyone can check).
// 1.3 (versionCode 4, release v0.9.40) is the first signed with the key of 1 Oct.
export const ANDROID_APK_URL: string | null =
  'https://github.com/farjadp/taghvim/releases/download/v0.9.40/taghvim-1.3.apk';

// The certificate every Taghvim APK is signed with (subject CN=Taghvim), so
// anyone handed the file somewhere else can check it came from here. It is
// public by nature — it is inside every APK — and it changes only if the key
// does: an APK signed with another key cannot update an install signed with
// this one. It DID change once, on 1 Oct 2026: the password of the 11 Sep key
// (2A:21:28:8E:…:68:6E, which signed 1.0–1.2) was lost, so 1.3 is signed with a
// new key — the same one Google Play signs with — and installs of 1.0–1.2 must
// be removed before 1.3 will install. The Android card says so.
export const ANDROID_CERT_SHA256 =
  'AF:5B:08:88:E0:9F:6B:19:0F:A9:66:C7:37:81:29:D7:03:BD:3C:2B:CB:D4:F5:22:32:8B:AC:13:1B:11:23:7B';

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
// APK and App Store URLs so the page cannot claim a download that does not
// exist, and so every state is testable without flipping a constant. While the
// iPhone app is not out, nothing names a date for it.
export function appsPanel(apkUrl: string | null, appStoreUrl: string | null = null) {
  const android = apkUrl !== null;
  const iphone = appStoreUrl !== null;
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
            // The key changed on 1 Oct 2026 (see ANDROID_CERT_SHA256). Android
            // refuses to install over an app signed with another key and says only
            // «App not installed»; this line is the explanation it does not give.
            'اگر نسخهٔ ۱٫۰ تا ۱٫۲ را از اینجا نصب کرده‌ای، اول آن را حذف کن؛ ۱٫۳ با کلید تازه امضا شده و روی نسخهٔ قبلی نصب نمی‌شود.',
            // Reported 11 Sep: a reader's phone showed «App blocked to protect your
            // device — Play Protect hasn't seen an app from this developer before».
            // It is about the developer being unknown to Google, not the file; the
            // way through is under More details. Remove once the app and its key
            // are registered with Google (developer verification / Play).
            'چون برنامه هنوز در گوگل‌پلی نیست، ممکن است Play Protect بگوید سازنده‌اش را نمی‌شناسد. زیر «More details» گزینهٔ «Install anyway» را بزن.',
          ],
          action: { label: 'دریافت فایل نصبی (APK)', href: apkUrl, external: true },
          fingerprint: ANDROID_CERT_SHA256,
        }
      : { id: 'android', name: 'اندروید', status: 'building', points: ['ویجت صفحهٔ خانه، در اندازهٔ کوچک و پهن'] },
    iphone
      ? {
          id: 'ios',
          name: 'آیفون',
          status: 'ready',
          points: [
            'ویجت صفحهٔ خانه و صفحهٔ قفل',
            // Deployment targets: the app 15.0, the widget extension 16.0 (the
            // lock-screen families need it).
            'iOS ۱۵ یا بالاتر؛ ویجت‌ها iOS ۱۶ می‌خواهند.',
            'بدون حساب کاربری و بدون هیچ درخواست شبکه.',
          ],
          action: { label: 'دریافت از App Store', href: appStoreUrl, external: true },
        }
      : { id: 'ios', name: 'آیفون', status: 'building', points: ['ویجت صفحهٔ خانه و صفحهٔ قفل'] },
  ];
  const ANNOUNCE = 'هر خبری اول همین‌جا و در صفحهٔ تغییرات نوشته می‌شود.';
  return {
    title: 'برنامهٔ اندروید و آیفون',
    summary: android && iphone
      ? 'هر دو برنامه آماده است: همان تقویم، به‌علاوهٔ ویجت روی صفحهٔ خانه، و در آیفون روی صفحهٔ قفل هم.'
      : android
        ? 'برنامهٔ اندروید آماده است: همان تقویم، به‌علاوهٔ ویجت روی صفحهٔ خانه. نسخهٔ آیفون، با ویجت صفحهٔ قفل، در دست ساخت است.'
        : 'هر دو برنامه در دست کدنویسی‌اند. همان تقویم، به‌علاوهٔ چیزی که فقط یک برنامهٔ نصبی می‌تواند داشته باشد: ویجت روی صفحهٔ خانه و صفحهٔ قفل.',
    platforms,
    note: 'اپ‌استور اپل از داخل ایران در دسترس نیست.',
    // Nothing is pending once both are out, so there is no timing line to show.
    timing: android && iphone
      ? null
      : android
        ? `زمان انتشار نسخهٔ آیفون هنوز معلوم نیست. ${ANNOUNCE}`
        : `زمان انتشار هنوز معلوم نیست. ${ANNOUNCE}`,
  };
}

export const APPS = appsPanel(ANDROID_APK_URL, APP_STORE_URL);

// What each widget holds. The page draws them with a fixed date — Nowruz 1406,
// labelled as an example — so a static page never shows a stale «today».
export const WIDGETS = [
  { id: 'small', name: 'کوچک', size: '۱×۱', on: 'اندروید و آیفون', shows: 'روز هفته، روز و ماه' },
  { id: 'wide', name: 'پهن', size: '۴×۱', on: 'اندروید', shows: 'تاریخ کامل، روز هفته و مناسبت' },
  { id: 'lock', name: 'صفحهٔ قفل', size: null, on: 'آیفون', shows: 'تاریخ و مناسبت، زیر ساعت' },
] as const;
