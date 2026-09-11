// ============================================================================
// Source: src/app/services/page.tsx
// Version: 0.9.37 — 2026-09-11
// Why: «خدمات ما», reached from the footer: the four services Farjad listed on
//      11 Sep. Every request goes through /contact, his pick, so the ways to
//      reach us stay in one place instead of being repeated per service.
// Env / Deps: Static server component; SiteHeader/SiteFooter like /about.
// ============================================================================

import type { Metadata } from "next";
import Link from "next/link";
import { Cpu, Languages, MonitorSmartphone, Users } from "lucide-react";
import { breadcrumbStructuredData, pageMetadata } from "@/lib/seo";
import { StructuredData } from "@/components/structured-data";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export const metadata: Metadata = pageMetadata({
  title: "خدمات ما | تقویم",
  description: "ساخت وب و اپلیکیشن، محصولات فارسی و راست‌چین، مشاورهٔ هوش مصنوعی و منتورینگ استارتاپ.",
  path: "/services",
});

export default function ServicesPage() {
  return (
    <>
      <SiteHeader />
      <StructuredData data={breadcrumbStructuredData("خدمات ما", "/services")} />
      <main className="mx-auto max-w-[820px] px-5 pt-12 pb-16 sm:px-8">
        <div className="mb-10">
          <h1 className="text-3xl font-extrabold text-forest sm:text-4xl">خدمات ما</h1>
          <p className="mt-3 text-sm leading-7 text-muted">
            همان کسانی که تقویم را ساخته‌اند، این کارها را برای دیگران هم انجام می‌دهند.
          </p>
        </div>

        <div className="mb-10 grid gap-4 sm:grid-cols-2">
          <Service icon={<MonitorSmartphone size={20} />} title="طراحی و ساخت وب و اپلیکیشن">
            از طراحی تا انتشار: سایت، افزونهٔ مرورگر، برنامهٔ اندروید و آیفون و ویجت.
          </Service>
          <Service icon={<Languages size={20} />} title="محصولات فارسی و راست‌چین">
            راست‌چینی درست، قلم و نیم‌فاصله، اعداد فارسی و تاریخ شمسی، برای محصولی که کاربر
            فارسی‌زبان دارد.
          </Service>
          <Service icon={<Cpu size={20} />} title="مشاورهٔ هوش مصنوعی">
            از طریق اشاویید: هوش مصنوعی کجای کارت واقعاً به درد می‌خورد و چطور ساخته شود.
          </Service>
          <Service icon={<Users size={20} />} title="منتورینگ استارتاپ">
            دوره‌های گروهی هشت‌هفته‌ای در ویزارودز: کشف مشتری و اعتبارسنجی ایده، پیش از ساختن.
          </Service>
        </div>

        <section className="rounded-2xl bg-leaf px-6 py-7">
          <h2 className="mb-2 text-base font-semibold text-forest">درخواست همکاری</h2>
          <p className="text-sm leading-7 text-muted">
            بنویس چه می‌خواهی بسازی یا کجا گیر کرده‌ای.{" "}
            <Link href="/contact" className="font-medium text-forest underline">راه‌های تماس</Link>
          </p>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}

// One service tile: icon, title, one-sentence description
function Service({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-line bg-surface p-5">
      <div className="mb-3 flex size-10 items-center justify-center rounded-lg bg-leaf text-forest">{icon}</div>
      <h2 className="mb-1.5 text-sm font-semibold text-ink">{title}</h2>
      <p className="text-xs leading-6 text-muted">{children}</p>
    </section>
  );
}
