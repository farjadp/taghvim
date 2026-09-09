// ============================================================================
// Source: src/app/bridges/page.tsx
// Version: 0.1.0 — 2026-09-09
// Why: Every holiday bridge of the year on one page. The home page shows the
//      next three; the rest, and next year, are here.
// Env / Deps: lib/seo for metadata; the list itself is a client island because
//      it reads the visitor's group switches. Dynamic, so the year is today's.
// ============================================================================

import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { StructuredData } from "@/components/structured-data";
import { BridgesPage as BridgesList } from "@/components/bridges-page";
import { breadcrumbStructuredData, pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "پل‌های تعطیلات | تقویم",
  description: "با یک یا دو روز مرخصی چند روز تعطیلی پیوسته می‌گیری؟ پل‌های تعطیلات سال شمسی، روز به روز، با روزهای مرخصی مشخص.",
  path: "/bridges",
});

// The year on this page has to be today's, not the build's.
export const dynamic = "force-dynamic";

export default function BridgesRoute() {
  return (
    <>
      <SiteHeader />
      <StructuredData data={breadcrumbStructuredData("پل‌های تعطیلات", "/bridges")} />
      <main className="mx-auto max-w-[1240px] px-5 pt-12 pb-16 sm:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-forest sm:text-4xl">پل‌های تعطیلات</h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-muted">
            هر بازه‌ای که با گرفتن حداکثر دو روز مرخصی به دست‌کم چهار روز تعطیلی پیوسته می‌رسد،
            به‌علاوهٔ بازه‌هایی که بدون مرخصی همین‌طورند. روزهای خط‌چین، روزهای مرخصی‌اند. فقط جمعه
            تعطیل هفتگی حساب شده؛ پنجشنبه نه. تعطیلاتِ دسته‌هایی که{" "}
            <Link href="/help#events" className="font-medium text-forest underline">زیر تقویم</Link>{" "}
            خاموش کرده‌ای در این فهرست نیستند.
          </p>
        </div>
        <BridgesList initialNow={new Date().toISOString()} />
      </main>
      <SiteFooter />
    </>
  );
}
