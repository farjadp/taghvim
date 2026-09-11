// ============================================================================
// Source: src/components/site-footer.tsx
// Version: 0.9.37 — 2026-09-11
// Why: Shared footer. Deliberately short: the brand line with the link to why
//      the calendar is built this way, the five pages, and five shortcuts.
//      Reporting a bug is Farjad's call of 9 Sep: a way to report that nobody
//      can find is a report nobody files. On 11 Sep he swapped the monthly
//      calendar, date converter and prayer times — all three already on the
//      home page — for /products, /support and /services. Who built
//      it, the company, the repository and the contact details all live on
//      /about — a footer that lists every link is a sitemap, not navigation.
// Env / Deps: Server component used by every page.
// ============================================================================

import Link from "next/link";
import Image from "next/image";
import { ArrowUpLeft } from "lucide-react";

const PAGES = [
  { href: "/download", label: "دریافت تقویم" },
  { href: "/help", label: "راهنما" },
  { href: "/about", label: "درباره ما" },
  { href: "/changelog", label: "تغییرات و نسخه‌ها" },
  { href: "/about#privacy", label: "حریم خصوصی" },
];

const SHORTCUTS = [
  { href: "/help#subscribe", label: "افزودن به تقویم گوگل و اپل" },
  { href: "/help#feedback", label: "گزارش اشکال یا پیشنهاد" },
  { href: "/products", label: "دیگر محصولات ما" },
  { href: "/support", label: "حمایت از ما" },
  { href: "/services", label: "خدمات ما" },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-line bg-surface">
      <div className="mx-auto max-w-[1240px] px-5 py-10 sm:px-8 sm:py-12">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr]">
          <div>
            <Link href="/" aria-label="تقویم، بازگشت به خانه" className="flex items-center gap-2.5 text-forest">
              <Image src="/icon.svg" width={36} height={36} alt="" unoptimized className="size-9 shrink-0" />
              <span className="text-xl font-extrabold">تقویم<span className="mr-1 text-clay">.</span></span>
            </Link>
            <p className="mt-4 max-w-xs text-xs leading-6 text-muted">
              تقویم ایرانی با رابط کاربری فارسی و راست‌چین. بدون ثبت‌نام، بدون تبلیغات، برای هر روز.
            </p>
            {/* Asked eight times under the launch thread and answered nowhere on the site */}
            <Link href="/about#why" className="mt-3 inline-flex items-center gap-1.5 text-xs text-forest hover:underline">
              چرا این تقویم با بقیه فرق دارد
              <ArrowUpLeft size={12} className="opacity-60" />
            </Link>
          </div>

          <nav aria-label="صفحات" className="flex flex-col gap-3">
            <h3 className="text-xs font-semibold text-ink">صفحات</h3>
            {PAGES.map((page) => (
              <Link key={page.href} href={page.href} className="text-xs text-muted hover:text-forest">{page.label}</Link>
            ))}
          </nav>

          <nav aria-label="دسترسی سریع" className="flex flex-col gap-3">
            <h3 className="text-xs font-semibold text-ink">دسترسی سریع</h3>
            {SHORTCUTS.map((shortcut) => (
              <Link key={shortcut.href} href={shortcut.href} className="text-xs text-muted hover:text-forest">{shortcut.label}</Link>
            ))}
          </nav>
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-6 text-[0.625rem] text-muted">
          <span className="text-sm font-bold text-forest">تقویم.</span>
          <p>تقویم قمری و اوقات شرعی محاسباتی‌اند؛ مناسبت‌ها گزیده‌اند.</p>
        </div>
      </div>
    </footer>
  );
}
