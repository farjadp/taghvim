// ============================================================================
// Source: src/app/about/page.tsx
// Version: 0.2.0 — 2026-09-07
// Why: Static about page: what the app does, what it deliberately leaves out.
// Env / Deps: Server component; shares SiteHeader/SiteFooter with the contact page.
// ============================================================================

import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { CalendarDays, ArrowLeftRight, Hourglass, MapPin, Globe, ShieldCheck } from "lucide-react";

export const metadata: Metadata = {
  title: "درباره ما | تقویم",
  description: "معرفی تقویم ایرانی، اهداف و امکانات پروژهٔ تقویم.",
};

// Sections: intro, features, limitations (disclaimers), credits
export default function AboutPage() {
  return (
    <>
      <SiteHeader active="about" />
      <main className="mx-auto max-w-[820px] px-5 pt-12 pb-16 sm:px-8">
        <div className="mb-10">
          <h1 className="text-3xl font-extrabold text-forest sm:text-4xl">درباره تقویم</h1>
          <p className="mt-3 text-sm leading-7 text-muted">
            تقویم، یک تقویم ایرانیِ ساده و تمیز است. ساخته شده برای اینکه روزها را بهتر ببینی؛
            بدون حواس‌پرتی، بدون ثبت‌نام، و بدون تبلیغات.
          </p>
        </div>

        <section className="mb-12">
          <h2 className="mb-4 text-lg font-semibold text-ink">چرا ساخته شد؟</h2>
          <div className="space-y-4 text-sm leading-7 text-muted">
            <p>
              تقویم‌های موجود پر از عناصر اضافی، تبلیغات و چیدمان‌های شلوغ بودند. خواستیم تقویمی
              بسازیم که فقط کارش را خوب انجام بدهد: نمایش روز، تاریخ و مناسبت‌ها — با هویت بصری
              مدرن و ایرانی.
            </p>
            <p>
              تقویم فارسی، میلادی و قمری را کنار هم می‌بیند، اوقات شرعی شهرهای ایران را نشان
              می‌دهد، و ابزارهای ساده‌ای برای تبدیل تاریخ و محاسبهٔ فاصله و سن در اختیارت
              می‌گذارد.
            </p>
          </div>
        </section>

        <section className="mb-12">
          <h2 className="mb-5 text-lg font-semibold text-ink">امکانات</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <FeatureCard icon={<CalendarDays size={20} />} title="تقویم ماهانه">
              نمایش گرید شمسی با شروع هفته از شنبه، ناوبری ماه/سال و بازگشت سریع به امروز.
            </FeatureCard>
            <FeatureCard icon={<Globe size={20} />} title="تاریخ‌های موازی">
              تاریخ شمسی، میلادی و قمری به‌صورت هم‌زمان برای هر روز.
            </FeatureCard>
            <FeatureCard icon={<ArrowLeftRight size={20} />} title="تبدیل تاریخ">
              تبدیل بین شمسی، میلادی و قمری با اعتبارسنجی ورودی.
            </FeatureCard>
            <FeatureCard icon={<Hourglass size={20} />} title="ابزارهای تاریخ">
              محاسبهٔ فاصلهٔ بین دو تاریخ و محاسبهٔ سن.
            </FeatureCard>
            <FeatureCard icon={<MapPin size={20} />} title="اوقات شرعی">
              اوقات شرعی ۱۲ شهر ایران با روش محاسبهٔ تهران.
            </FeatureCard>
            <FeatureCard icon={<ShieldCheck size={20} />} title="حریم خصوصی">
              بدون حساب کاربری، بدون پایگاه داده. فقط شهر انتخاب‌شده در مرورگرت ذخیره می‌شود.
            </FeatureCard>
          </div>
        </section>

        <section className="mb-12">
          <h2 className="mb-4 text-lg font-semibold text-ink">ملاحظات داده</h2>
          <ul className="space-y-2.5 text-sm leading-6 text-muted">
            <li>• تاریخ‌ها بر اساس روز مدنی در <span dir="ltr">Asia/Tehran</span> تفسیر می‌شوند.</li>
            <li>• تاریخ قمری از تقویم محاسباتی <span dir="ltr">islamic-civil</span> است و ممکن است با رصدیِ ایران تفاوت داشته باشد.</li>
            <li>• مناسبت‌ها مجموعه‌ای برگزیده و تکرارشونده هستند، نه تقویم رسمیِ کامل.</li>
            <li>• اوقات شرعی محاسباتی‌اند و تقریبی.</li>
          </ul>
        </section>

        <section className="rounded-2xl bg-leaf px-6 py-7">
          <h2 className="mb-2 text-base font-semibold text-forest">تکنولوژی</h2>
          <p className="text-sm leading-6 text-muted">
            ساخته‌شده با Next.js، React، TypeScript و Tailwind CSS. تقویم شمسی با
            <span dir="ltr"> jalaali-js </span> و اوقات شرعی با
            <span dir="ltr"> adhan </span> محاسبه می‌شوند. تایپوگرافی فارسی با فونت وزیرمتن.
          </p>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}

// One feature tile: icon, title, one-sentence description
function FeatureCard({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-line bg-white p-5">
      <div className="mb-3 flex size-10 items-center justify-center rounded-lg bg-leaf text-forest">{icon}</div>
      <h3 className="mb-1.5 text-sm font-semibold text-ink">{title}</h3>
      <p className="text-xs leading-6 text-muted">{children}</p>
    </div>
  );
}
