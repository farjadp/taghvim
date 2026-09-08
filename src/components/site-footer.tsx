// ============================================================================
// Source: src/components/site-footer.tsx
// Version: 0.9.4 — 2026-09-08
// Why: Shared footer: navigation, AshaVid/personal links, repo link, disclaimers,
//      and the link to why the calendar is built this way.
// Env / Deps: Server component used by every page.
// ============================================================================

import Link from "next/link";
import Image from "next/image";
import { ArrowUpLeft, Mail, Phone, Building2, GitBranch } from "lucide-react";

// Four columns on desktop: brand, pages, tools, contact; disclaimers underneath
export function SiteFooter() {
  return (
    <footer className="border-t border-line bg-surface">
      <div className="mx-auto max-w-[1240px] px-5 py-10 sm:px-8 sm:py-12">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-1">
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
            <Link href="/about" className="flex items-center gap-1.5 text-xs text-muted hover:text-forest">
              درباره ما
            </Link>
            <Link href="/changelog" className="flex items-center gap-1.5 text-xs text-muted hover:text-forest">
              تغییرات و نسخه‌ها
            </Link>
            <Link href="/contact" className="flex items-center gap-1.5 text-xs text-muted hover:text-forest">
              تماس با ما
            </Link>
            <a
              href="https://www.ashavid.ca"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs text-muted hover:text-forest"
            >
              <Building2 size={14} />
              اشاویید
              <ArrowUpLeft size={12} className="opacity-60" />
            </a>
          </nav>

          <div className="flex flex-col gap-3">
            <h3 className="text-xs font-semibold text-ink">دسترسی سریع</h3>
            <Link href="/#calendar" className="text-xs text-muted hover:text-forest">تقویم ماهانه</Link>
            <Link href="/#tools" className="text-xs text-muted hover:text-forest">تبدیل تاریخ</Link>
            <Link href="/#prayer" className="text-xs text-muted hover:text-forest">اوقات شرعی</Link>
            <Link href="/about#subscribe" className="text-xs text-muted hover:text-forest">افزودن به تقویم گوگل و اپل</Link>
          </div>

          <div className="flex flex-col gap-3">
            <h3 className="text-xs font-semibold text-ink">ساخته‌شده توسط</h3>
            <a
              href="https://farjadp.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs text-muted hover:text-forest"
            >
              فرجاد پورمحمد
              <ArrowUpLeft size={12} className="opacity-60" />
            </a>
            <a
              href="https://github.com/farjadp/taghvim"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs text-muted hover:text-forest"
            >
              <GitBranch size={14} />
              کد پروژه در گیت‌هاب
              <ArrowUpLeft size={12} className="opacity-60" />
            </a>
            <a href="mailto:farjad@ashavid.ca" className="flex items-center gap-1.5 text-xs text-muted hover:text-forest">
              <Mail size={14} />
              farjad@ashavid.ca
            </a>
            <a href="tel:+14376611674" className="flex items-center gap-1.5 text-xs text-muted hover:text-forest" dir="ltr">
              <Phone size={14} />
              +1 (437) 661-1674
            </a>
          </div>
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-6 text-[0.625rem] text-muted">
          <span className="text-sm font-bold text-forest">تقویم.</span>
          <p>تقویم قمری و اوقات شرعی محاسباتی‌اند؛ مناسبت‌ها گزیده‌اند.</p>
        </div>
      </div>
    </footer>
  );
}
