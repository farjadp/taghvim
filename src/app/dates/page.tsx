// ============================================================================
// Source: src/app/dates/page.tsx
// Version: 0.1.0 — 2026-09-09
// Why: The visitor's own birthdays and anniversaries. A page of its own rather
//      than a sixth tool tab: it is the only thing in the app they write, and
//      the tab strip already scrolls sideways on a phone with five.
// Env / Deps: lib/seo for metadata; the list is a client island because it
//      only exists in the browser. Static — nothing here depends on today.
// ============================================================================

import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { StructuredData } from "@/components/structured-data";
import { DatesPage } from "@/components/dates-page";
import { breadcrumbStructuredData, pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "تاریخ‌های من | تقویم",
  description: "تولدها و سالگردها را به تاریخ شمسی نگه دار و به تقویم خودت اضافه کن. فقط در مرورگر خودت ذخیره می‌شود؛ نه حسابی لازم است، نه به سروری فرستاده می‌شود.",
  path: "/dates",
});

export default function DatesRoute() {
  return (
    <>
      <SiteHeader />
      <StructuredData data={breadcrumbStructuredData("تاریخ‌های من", "/dates")} />
      <main className="mx-auto max-w-[1240px] px-5 pt-12 pb-16 sm:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-forest sm:text-4xl">تاریخ‌های من</h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-muted">
            تولدها و سالگردهایی که می‌خواهی به تاریخ شمسی جلوی چشمت باشند. روزی که اضافه کنی در
            تقویم صفحهٔ اصلی هم نشان می‌گیرد. این فهرست فقط در حافظهٔ همین مرورگر می‌ماند —
            نه حسابی لازم است، نه به سروری می‌رسد، و{" "}
            <Link href="/about#privacy" className="font-medium text-forest underline">بین دستگاه‌هایت همگام نمی‌شود</Link>.
            برای اینکه یادآوری واقعی بگیری، خروجی بگیر و به تقویم خودت اضافه کن.
          </p>
        </div>
        <DatesPage />
      </main>
      <SiteFooter />
    </>
  );
}
