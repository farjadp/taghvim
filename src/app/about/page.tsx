// ============================================================================
// Source: src/app/about/page.tsx
// Version: 0.9.5 — 2026-09-08
// Why: Static about page: what the app does, what it deliberately leaves out.
// Env / Deps: Server component; shares SiteHeader/SiteFooter with the contact page.
// ============================================================================

import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { CalendarDays, ArrowLeftRight, Hourglass, MapPin, Globe, ShieldCheck, Flame, Palette, CalendarPlus, ArrowUpLeft } from "lucide-react";
import { ZODIAC_NOTICE } from "@/lib/zodiac";
import { FEED_NAME } from "@/lib/ics";

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
            تقویم ایرانی برای وب. تاریخ شمسی، میلادی و قمری را کنار هم نشان می‌دهد،
            مناسبت‌ها را فهرست می‌کند و چند ابزار تاریخ دارد. حساب کاربری، تبلیغات و
            پایگاه داده ندارد.
          </p>
        </div>

        <section id="why" className="mb-12 scroll-mt-24">
          <h2 className="mb-4 text-lg font-semibold text-ink">چرا ساخته شد؟</h2>
          <div className="space-y-4 text-sm leading-7 text-muted">
            <p>
              تقویم‌های فارسیِ موجود شلوغ‌اند: تبلیغات، پاپ‌آپ، و بخش‌هایی که کسی دنبالشان
              نیامده. اینجا فقط تاریخ، مناسبت و چند ابزار هست.
            </p>
            <p>
              داده‌ای از تو ذخیره نمی‌شود، جز چند تنظیم در مرورگر خودت. هرجا هم که عدد قطعی
              نیست، مثل تعطیلات قمری، همان‌جا نوشته شده است.
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
              تاریخ شمسی، میلادی و قمری به‌صورت هم‌زمان برای هر روز، به‌همراه برج فلکی همان
              روز. اگر بیرون از ایران باشی، ساعت خودت و تا دو شهر دلخواه هم می‌آید.
            </FeatureCard>
            <FeatureCard icon={<ArrowLeftRight size={20} />} title="تبدیل تاریخ">
              تبدیل بین شمسی، میلادی و قمری با اعتبارسنجی ورودی.
            </FeatureCard>
            <FeatureCard icon={<Hourglass size={20} />} title="ابزارهای تاریخ">
              محاسبهٔ فاصلهٔ بین دو تاریخ و محاسبهٔ سن.
            </FeatureCard>
            <FeatureCard icon={<MapPin size={20} />} title="اوقات شرعی">
              اوقات شرعی ۱۲ شهر ایران با روش محاسبهٔ تهران. با کلید «مذهبی» در راهنمای
              زیر تقویم روشن می‌شود؛ نمایش مناسبت‌های دولتی مستقل است.
            </FeatureCard>
            <FeatureCard icon={<Flame size={20} />} title="یادبود جاویدنامان">
              در هر بار باز شدن صفحه، نام و عکس یکی از جان‌باختگان شناسایی‌شدهٔ ۱۸ و ۱۹ دی،
              با پیوند به صفحهٔ او در فهرست منبع. با کلید «یادبود» در راهنمای زیر تقویم
              می‌توانی این پنل را پنهان یا دوباره نمایش بدهی.
            </FeatureCard>
            <FeatureCard icon={<Palette size={20} />} title="پوسته و قلم">
              حالت تیره، سه اندازهٔ قلم و پنج قلم فارسی، از منوی تنظیمات در نوار بالا.
            </FeatureCard>
            <FeatureCard icon={<ShieldCheck size={20} />} title="حریم خصوصی">
              بدون حساب کاربری، بدون پایگاه داده. شش رکورد تنظیم در مرورگر خودت می‌ماند:
              شهر اوقات شرعی، پوسته، قلم، اندازهٔ قلم، ساعت شهرهای انتخابی و تنظیمات نمایش.
              تنظیمات نمایش شامل مذهبی، دولتی، جهانی و یادبود است؛ ملی و فرهنگی همیشه نمایش داده می‌شود.
              کلیدهای ذخیره‌سازی: <bdi dir="ltr">taghvim-city</bdi>، <bdi dir="ltr">taghvim-theme</bdi>،
              <bdi dir="ltr"> taghvim-font</bdi>، <bdi dir="ltr">taghvim-size</bdi>،
              <bdi dir="ltr"> taghvim-clocks</bdi> و <bdi dir="ltr">taghvim-view</bdi>.
              انتخاب قبلی مناسبت‌ها خودکار به تنظیمات جدید منتقل می‌شود.
            </FeatureCard>
          </div>
        </section>

        {/* The how-to lives on /help; duplicating it here would be two copies
            of the same instructions drifting apart. This keeps the caveat, which
            is a fact about the data, and points at the steps. */}
        <section id="subscribe" className="mb-12 scroll-mt-24">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-ink">
            <CalendarPlus size={20} className="text-forest" />
            افزودن به تقویم گوگل و اپل
          </h2>
          <div className="space-y-4 text-sm leading-7 text-muted">
            <p>
              می‌توانی {FEED_NAME} را به تقویم گوشی یا رایانه‌ات اضافه کنی تا داخل همان
              تقویمی بیاید که هر روز باز می‌کنی.{" "}
              <Link href="/help#subscribe" className="font-medium text-forest underline">مراحلش در راهنما</Link> نوشته شده است.
            </p>
            <p>
              <strong className="font-medium text-ink">تعطیلات مذهبی قمری در این فهرست نیست.</strong>{" "}
              تاریخشان بر پایهٔ رؤیت هلال تعیین می‌شود و اینجا فقط سه تاریخ از سال ۱۴۰۵ بر
              پایهٔ تقویم رسمی تثبیت شده است. پس این فهرست تقویم رسمی کامل نیست و برای
              برنامه‌ریزی تعطیلات قمری به آن تکیه نکن.
            </p>
          </div>
        </section>

        {/* Everything that used to crowd the footer: who built it, the company,
            the repository and the way to reach us, in one place. */}
        <section id="links" className="mb-12 scroll-mt-24">
          <h2 className="mb-4 text-lg font-semibold text-ink">پیوندها و تماس</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <Link href="/contact" className="flex items-center justify-between gap-3 rounded-xl border border-line bg-surface px-4 py-3 text-sm text-ink hover:border-forest">
              تماس با ما
              <span className="text-xs text-muted">ایمیل، تلفن و شبکه‌های اجتماعی</span>
            </Link>
            <Link href="/help" className="flex items-center justify-between gap-3 rounded-xl border border-line bg-surface px-4 py-3 text-sm text-ink hover:border-forest">
              راهنمای استفاده
              <span className="text-xs text-muted">چطور هر کاری را انجام بدهی</span>
            </Link>
            <ExternalLink href="https://github.com/farjadp/taghvim" title="کد پروژه در گیت‌هاب" note="متن‌باز، برای دیدن و بررسی" />
            <ExternalLink href="https://farjadp.com" title="فرجاد پورمحمد" note="سازندهٔ این پروژه" />
            <ExternalLink href="https://www.ashavid.ca" title="اشاویید" note="شرکتی که این پروژه زیر آن ساخته شد" />
          </div>
        </section>

        <section className="rounded-2xl bg-leaf px-6 py-7">
          <h2 className="mb-2 text-base font-semibold text-forest">تکنولوژی</h2>
          <p className="text-sm leading-6 text-muted">
            ساخته‌شده با Next.js، React، TypeScript و Tailwind CSS. تقویم شمسی با
            <span dir="ltr"> jalaali-js </span> و اوقات شرعی با
            <span dir="ltr"> adhan </span> محاسبه می‌شوند. هر پنج قلم روی همین سرور میزبانی می‌شوند و هیچ درخواستی به سرور دیگری نمی‌رود.
          </p>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}

// One outbound row in the links section
function ExternalLink({ href, title, note }: { href: string; title: string; note: string }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between gap-3 rounded-xl border border-line bg-surface px-4 py-3 text-sm text-ink hover:border-forest">
      <span className="flex items-center gap-1.5">{title}<ArrowUpLeft size={12} className="text-muted" /></span>
      <span className="text-xs text-muted">{note}</span>
    </a>
  );
}

// One feature tile: icon, title, one-sentence description
function FeatureCard({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-line bg-surface p-5">
      <div className="mb-3 flex size-10 items-center justify-center rounded-lg bg-leaf text-forest">{icon}</div>
      <h3 className="mb-1.5 text-sm font-semibold text-ink">{title}</h3>
      <p className="text-xs leading-6 text-muted">{children}</p>
    </div>
  );
}
