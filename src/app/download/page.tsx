// ============================================================================
// Source: src/app/download/page.tsx
// Version: 0.9.33 — 2026-09-11
// Why: One page for getting the calendar onto a device. Every method carries
//      its real status, and each extension only offers a store button once
//      lib/downloads has a store URL for it. The Android and iPhone apps get a
//      panel of their own with the widgets drawn, since widgets are why most
//      people asked for an app. Each platform has its own status; Android
//      offers its APK and the signing certificate's fingerprint only once
//      ANDROID_APK_URL is set, the day the GitHub release is published.
// Env / Deps: lib/downloads for the data, lib/seo for metadata. Server
//      component; no state, nothing client-side.
// ============================================================================

import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpLeft, CalendarPlus, Check, Hammer, Hourglass, Puzzle, Smartphone } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { StructuredData } from "@/components/structured-data";
import { APPS, CHROME_STORE_URL, DOWNLOAD_METHODS, STATUS_LABELS, WIDGETS, type DownloadMethod, type DownloadStatus } from "@/lib/downloads";
import { UPCOMING, UPCOMING_APP, UPCOMING_NOTICE } from "@/lib/changelog";
import { breadcrumbStructuredData, pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "دریافت تقویم | تقویم",
  description: "تقویم را روی گوشی، مرورگر یا تقویم گوگل و اپل داشته باش: افزودن به صفحهٔ خانه، افزونهٔ کروم و فایرفاکس، و فهرست اشتراکی مناسبت‌ها.",
  path: "/download",
});

const ICONS: Record<string, typeof Smartphone> = {
  "home-screen": Smartphone,
  chrome: Puzzle,
  firefox: Puzzle,
  "calendar-feed": CalendarPlus,
};

// Colour carries the same meaning as the word beside it; the word is what a
// screen reader gets, so the dot is decorative.
const STATUS_STYLES: Record<DownloadStatus, string> = {
  ready: "border-forest/40 bg-leaf text-forest",
  review: "border-clay/40 bg-holiday text-clay",
  building: "border-forest/40 bg-leaf text-forest",
  planned: "border-line bg-paper text-muted",
};

function StatusPill({ status }: { status: DownloadStatus }) {
  const Icon = status === "ready" ? Check : status === "review" ? Hourglass : null;
  return (
    <span className={`flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-[0.625rem] ${STATUS_STYLES[status]}`}>
      {Icon && <Icon size={12} />}
      {STATUS_LABELS[status]}
    </span>
  );
}

function MethodCard({ method }: { method: DownloadMethod }) {
  const Icon = ICONS[method.id] ?? Smartphone;
  const action = method.action;
  return (
    <section id={method.id} className="scroll-mt-24 rounded-2xl border border-line bg-surface p-6 sm:p-7">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <h2 className="flex items-center gap-3 text-base font-semibold text-ink">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-leaf text-forest"><Icon size={20} /></span>
          {method.title}
        </h2>
        <StatusPill status={method.status} />
      </div>

      <p className="mt-4 text-sm leading-7 text-muted">{method.summary}</p>

      <ol className="mt-4 space-y-2.5 border-r border-line pr-5">
        {method.steps.map((step) => <li key={step} className="text-sm leading-7 text-muted">{step}</li>)}
      </ol>

      {method.note && (
        <p className="mt-4 rounded-xl border border-line bg-paper px-4 py-3 text-xs leading-6 text-muted">{method.note}</p>
      )}

      {action && (
        action.external
          ? <a href={action.href} target="_blank" rel="noopener noreferrer" className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-forest hover:underline">{action.label}<ArrowUpLeft size={13} className="opacity-60" /></a>
          : <Link href={action.href} className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-forest hover:underline">{action.label}<ArrowUpLeft size={13} className="opacity-60" /></Link>
      )}
    </section>
  );
}


// The widgets, drawn. «۴×۱» is isolated LTR: in the RTL flow the × between two
// numbers let the pair reorder, and a size reads width first. The lock-screen clock
// is isolated too, as a guard only — digits around a colon already held their order.
// A fixed day — 1 Farvardin 1406, Nowruz — and labelled as an
// example, because this page is static and a drawn «today» would go stale by morning.
// The designs are the ones Farjad picked on 10 Sep from /sandbox/widgets: small
// B, wide B, lock screen C. The numeral is clay because Nowruz is a day off.
function WidgetSmall() {
  return (
    <div className="flex size-[5.75rem] flex-col items-center justify-center rounded-[1.4rem] bg-surface text-ink shadow-lg shadow-black/20">
      <span className="text-[0.5625rem] text-muted">یکشنبه</span>
      <span className="text-[2rem] leading-tight font-extrabold text-clay">۱</span>
      <span className="text-[0.6875rem] font-medium">فروردین</span>
    </div>
  );
}

function WidgetWide() {
  return (
    <div className="flex h-[5.75rem] w-full items-stretch overflow-hidden rounded-[1.4rem] bg-surface text-ink shadow-lg shadow-black/20">
      {/* text-paper, not white: dark clay is a light salmon, and white on it is unreadable. */}
      <div className="flex w-[4.5rem] shrink-0 flex-col items-center justify-center bg-clay text-paper">
        <span className="text-[2rem] leading-none font-extrabold">۱</span>
        <span className="mt-1 text-[0.6875rem]">فروردین</span>
      </div>
      <div className="flex min-w-0 flex-1 flex-col justify-center px-4">
        <p className="text-sm font-bold">یکشنبه ۱۴۰۶</p>
        <p className="truncate text-[0.6875rem] text-clay">نوروز</p>
      </div>
    </div>
  );
}

function WidgetLock() {
  return (
    <div className="flex w-[11rem] flex-col items-center rounded-[1.6rem] bg-black/25 px-4 pt-3 pb-4 text-white">
      <span dir="ltr" className="text-[2.4rem] leading-tight font-light tabular-nums [unicode-bidi:isolate]">۹:۴۱</span>
      <div className="mt-1 flex w-full items-center gap-2.5 rounded-xl bg-white/15 px-2.5 py-2">
        <span className="text-[1.75rem] leading-none font-extrabold">۱</span>
        <span className="min-w-0">
          <span className="block text-[0.75rem] font-bold">فروردین ۱۴۰۶</span>
          <span className="block text-[0.625rem] opacity-80">نوروز</span>
        </span>
      </div>
    </div>
  );
}

const WIDGET_DRAWINGS = { small: WidgetSmall, wide: WidgetWide, lock: WidgetLock } as const;

function AppStatus({ status }: { status: DownloadStatus }) {
  return (
    <span className="flex shrink-0 items-center gap-1.5 rounded-full border border-white/30 bg-white/10 px-3 py-1 text-[0.6875rem]">
      {status === "ready" ? <Check size={12} /> : <Hammer size={12} />}{STATUS_LABELS[status]}
    </span>
  );
}

function AppsPanel() {
  const first = APPS.platforms[0].status;
  const shared = APPS.platforms.every((platform) => platform.status === first) ? first : null;
  return (
    <section id="apps" aria-labelledby="apps-title" className="relative isolate scroll-mt-24 overflow-hidden rounded-[1.75rem] bg-forest-deep px-6 py-8 text-white sm:px-9 sm:py-10">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <h2 id="apps-title" className="text-xl font-bold sm:text-2xl">{APPS.title}</h2>
        {shared && <AppStatus status={shared} />}
      </div>
      <p className="mt-3 max-w-xl text-sm leading-7 text-[#d9e3cf]">{APPS.summary}</p>

      {/* While both apps share a status the panel carries one label, as it always
          has. Once Android is out and the iPhone is not, one label would be wrong
          for one of them, so each platform carries its own. */}
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {APPS.platforms.map((platform) => (
          <div key={platform.id} id={`app-${platform.id}`} className="flex flex-col rounded-2xl border border-white/15 bg-white/5 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="flex items-center gap-2 text-sm font-semibold"><Smartphone size={16} className="text-[#c8d4a8]" />{platform.name}</p>
              {!shared && <AppStatus status={platform.status} />}
            </div>
            <ul className="mt-2 space-y-1">
              {platform.points.map((point) => <li key={point} className="text-xs leading-6 text-[#d9e3cf]">{point}</li>)}
            </ul>
            {platform.action && (
              <a
                href={platform.action.href}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex w-fit items-center gap-1.5 rounded-full bg-white px-4 py-2 text-xs font-semibold text-forest-deep hover:bg-[#e8efe0]"
              >
                {platform.action.label}<ArrowUpLeft size={14} />
              </a>
            )}
            {platform.fingerprint && (
              <div className="mt-4 border-t border-white/15 pt-3">
                <p className="text-[0.6875rem] font-medium">اثر انگشت گواهی امضا (SHA-256)</p>
                <p className="mt-1 text-[0.625rem] leading-5 text-[#d9e3cf]">
                  هر نسخهٔ تقویم با همین کلید امضا می‌شود. اگر فایل را از جای دیگری گرفته‌ای و اثر انگشتش این نیست، نصبش نکن.
                </p>
                {/* Two lines of sixteen bytes, which may break again only after a
                    colon. break-all split a byte in half («…03:9» then «4:7D…»),
                    the worst place for a string people compare by eye; a line that
                    could not break at all fixed the card at 317px and pushed it off
                    a 320 or 360px screen. <wbr> allows a break at byte edges only. */}
                <p dir="ltr" className="mt-2 font-mono text-[0.625rem] leading-5 text-[#c8d4a8] [unicode-bidi:isolate]">
                  {[0, 16].map((start) => {
                    const bytes = platform.fingerprint!.split(":").slice(start, start + 16);
                    return (
                      <span key={start} className="block">
                        {bytes.map((byte, i) => (
                          <span key={i}>{byte}{i < bytes.length - 1 && <>:<wbr /></>}</span>
                        ))}
                      </span>
                    );
                  })}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>

      <h3 className="mt-9 text-sm font-semibold">ویجت‌ها</h3>
      <p className="mt-1 text-xs text-[#d9e3cf]">ویجت پرتکرارترین درخواست کاربرها بود. نمونه‌ها با تاریخ نوروز ۱۴۰۶:</p>
      <div className="mt-4 rounded-[1.4rem] bg-[#173d30] p-5 sm:p-6">
        <div className="flex flex-wrap items-end gap-x-6 gap-y-7">
          {WIDGETS.map((widget) => {
            const Drawing = WIDGET_DRAWINGS[widget.id];
            return (
              // The wide drawing takes the row up to 19rem. It used to be a fixed
              // 19rem inside a figure that grew to fit it, so its max-w-full had
              // nothing to cap: measured on taghv.im it overran its box by 22px at
              // 390px wide and ran off the screen at 360 and 320. (The page's
              // sideways scroll at those widths is the header's nav, not this.)
              <figure key={widget.id} className={`flex flex-col items-center gap-2.5 ${widget.id === "wide" ? "w-full max-w-[19rem]" : ""}`} data-widget={widget.id}>
                <Drawing />
                <figcaption className="text-center text-[0.6875rem] leading-5">
                  <span className="font-medium">{widget.name}{widget.size && <> · <span dir="ltr" className="tabular-nums [unicode-bidi:isolate]">{widget.size}</span></>}</span>
                  <span className="block text-[#c8d4a8]">{widget.on}</span>
                  <span className="block text-[0.625rem] text-[#d9e3cf]">{widget.shows}</span>
                </figcaption>
              </figure>
            );
          })}
        </div>
      </div>

      <div className="mt-6 space-y-1 text-xs leading-6 text-[#d9e3cf]">
        <p>{APPS.timing}</p>
        <p>{APPS.note}</p>
      </div>
    </section>
  );
}

// «و بقیه»: the rest of what is being considered, from the same list the changelog
// shows, less the apps line the panel above already covers.
function NextUp() {
  const rest = UPCOMING.filter((line) => line !== UPCOMING_APP);
  return (
    <section aria-labelledby="next-title" className="rounded-2xl border border-line bg-surface p-6 sm:p-7">
      <h2 id="next-title" className="text-base font-semibold text-ink">بقیهٔ چیزهایی که در راه است</h2>
      <ul className="mt-4 space-y-3">
        {rest.map((line) => (
          <li key={line} className="flex gap-3 text-sm leading-7 text-muted">
            <span aria-hidden="true" className="mt-[0.7rem] size-2 shrink-0 rounded-full border border-muted/60" />
            <span>{line}</span>
          </li>
        ))}
      </ul>
      <p className="mt-4 text-xs leading-6 text-muted">{UPCOMING_NOTICE}</p>
    </section>
  );
}

export default function DownloadPage() {
  const ready = DOWNLOAD_METHODS.filter((method) => method.status === "ready");
  const rest = DOWNLOAD_METHODS.filter((method) => method.status !== "ready");
  return (
    <>
      <SiteHeader active="download" />
      <StructuredData data={breadcrumbStructuredData("دریافت تقویم", "/download")} />
      <main className="mx-auto max-w-[860px] px-5 pt-12 pb-16 sm:px-8">
        <div className="mb-10">
          <h1 className="text-3xl font-extrabold text-forest sm:text-4xl">دریافت تقویم</h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-muted">
            چیزی برای دانلود کردن نیست. تقویم یک سایت است و همان‌طور که هست کار می‌کند — این
            صفحه راه‌هایی را می‌گوید که می‌شود آن را نزدیک‌تر آورد: روی صفحهٔ خانهٔ گوشی، در تب
            جدید مرورگر، یا داخل تقویمی که هر روز باز می‌کنی. هیچ‌کدام حساب کاربری نمی‌خواهد.
          </p>
        </div>

        <h2 className="mb-4 text-xs font-semibold text-ink">همین حالا</h2>
        <div className="space-y-5">
          {ready.map((method) => <MethodCard key={method.id} method={method} />)}
        </div>

        <h2 className="mt-10 mb-4 text-xs font-semibold text-ink">در راه</h2>
        <div className="space-y-5">
          <AppsPanel />
          {rest.map((method) => <MethodCard key={method.id} method={method} />)}
          <NextUp />
        </div>

        {/* Until the store approves the listing there is no link to give, and a
            dead "coming soon" button is worse than a sentence. */}
        {!CHROME_STORE_URL && (
          <p className="mt-8 text-xs leading-6 text-muted">
            وقتی افزونهٔ کروم از بازبینی گوگل رد شود، نشانی فروشگاهش همین‌جا و در{" "}
            <Link href="/changelog" className="font-medium text-forest underline">صفحهٔ تغییرات</Link> نوشته می‌شود.
          </p>
        )}
      </main>
      <SiteFooter />
    </>
  );
}
