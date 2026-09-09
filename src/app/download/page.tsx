// ============================================================================
// Source: src/app/download/page.tsx
// Version: 0.9.15 — 2026-09-09
// Why: One page for getting the calendar onto a device. Every method carries
//      its real status, so nothing here claims something that is not built:
//      the Android app says it has not started, and each extension only
//      offers a store button once lib/downloads has a store URL for it.
// Env / Deps: lib/downloads for the data, lib/seo for metadata. Server
//      component; no state, nothing client-side.
// ============================================================================

import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpLeft, CalendarPlus, Check, Hourglass, Package, PackageCheck, Puzzle, Smartphone } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { StructuredData } from "@/components/structured-data";
import { CHROME_STORE_URL, DOWNLOAD_METHODS, STATUS_LABELS, type DownloadMethod, type DownloadStatus } from "@/lib/downloads";
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
  android: Package,
};

// Colour carries the same meaning as the word beside it; the word is what a
// screen reader gets, so the dot is decorative.
const STATUS_STYLES: Record<DownloadStatus, string> = {
  ready: "border-forest/40 bg-leaf text-forest",
  // 'built' shares the clay treatment with 'review': both mean "real, but not
  // yet something you can install", which is the distinction that matters here.
  built: "border-clay/40 bg-holiday text-clay",
  review: "border-clay/40 bg-holiday text-clay",
  planned: "border-line bg-paper text-muted",
};

const STATUS_ICONS: Partial<Record<DownloadStatus, typeof Check>> = {
  ready: Check,
  built: PackageCheck,
  review: Hourglass,
};

function StatusPill({ status }: { status: DownloadStatus }) {
  const Icon = STATUS_ICONS[status] ?? null;
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
          {rest.map((method) => <MethodCard key={method.id} method={method} />)}
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
