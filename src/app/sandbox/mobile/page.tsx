// ============================================================================
// Source: src/app/sandbox/mobile/page.tsx
// Version: 0.9.1-sandbox — 2026-09-08
// Why: SANDBOX for the open question: how far down the month grid sits on a
//      phone. `@ketabdardev` asked for the full month in the first view; today
//      the first day cell is at 1128px on a 812px screen. Four arrangements,
//      measured. Unlinked and noindex.
// Env / Deps: components/sandbox-mobile and ./frame. Deleting src/app/sandbox
//      and src/components/sandbox-mobile.tsx removes this with no other change.
// ============================================================================

import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { MobileSandbox } from "@/components/sandbox-mobile";

export const metadata: Metadata = {
  title: "آزمایش چیدمان موبایل | تقویم",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default function MobileSandboxPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-[1600px] px-4 pt-10 pb-16 sm:px-8">
        <div className="mb-8 rounded-2xl border border-clay/40 bg-holiday px-6 py-5">
          <h1 className="text-xl font-bold text-clay">آزمایشگاه · چیدمان موبایل</h1>
          <p className="mt-2 text-sm leading-7 text-ink">
            هر قاب یک آی‌فریم واقعی ۳۹۰×۶۶۴ است، نه ماکت: همان صفحهٔ اصلی با همان کد، پس
            بریک‌پوینت‌های موبایل خودشان اعمال می‌شوند. ۶۶۴ همان ارتفاعی است که Playwright برای
            آی‌فون ۱۳ استفاده می‌کند — یعنی آنچه بعد از نوار آدرس مرورگر واقعاً می‌ماند، نه ۸۴۴
            پیکسل خودِ دستگاه. خط چین پایین هر قاب، خط تاست. اعداد از داخل همان قاب خوانده شده‌اند.
          </p>
          <p className="mt-2 text-sm leading-7 text-ink">
            پرسش `@ketabdardev` این بود: «انتظار اصلی ما دیدن تقویم (ماه کامل) در ویو اول
            است.» پس معیار آخر، همان است — نه فقط رسیدن به گرید، بلکه جا شدن کل ماه بالای خط تا.
          </p>
        </div>
        <MobileSandbox />
      </main>
      <SiteFooter />
    </>
  );
}
