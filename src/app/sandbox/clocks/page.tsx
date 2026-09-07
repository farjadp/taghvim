// ============================================================================
// Source: src/app/sandbox/clocks/page.tsx
// Version: 0.7.0-sandbox — 2026-09-07
// Why: SANDBOX. Three ways to show a second clock beside Tehran's, so the
//      choice can be made by looking rather than by describing. Not linked
//      from anywhere and noindex. Nothing on the live site imports this.
// Env / Deps: lib/clocks. To drop the whole idea: delete src/app/sandbox
//      and src/lib/clocks.ts (+ its test). Nothing else references them.
// ============================================================================

import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ClockSandbox } from "@/components/sandbox-clocks";

export const metadata: Metadata = {
  title: "آزمایش ساعت‌ها | تقویم",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default function ClockSandboxPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-[1240px] px-4 pt-10 pb-16 sm:px-8">
        <div className="mb-8 rounded-2xl border border-clay/40 bg-holiday px-6 py-5">
          <h1 className="text-xl font-bold text-clay">آزمایشگاه · ساعت دوم</h1>
          <p className="mt-2 text-sm leading-7 text-ink">
            این صفحه بخشی از سایت نیست: از هیچ‌جا لینک نشده و برای موتورهای جست‌وجو بسته است.
            سه شکل از یک ایده اینجاست تا با چشم انتخاب کنی. ساعت تهران در هر سه، ساعت اصلی می‌ماند.
          </p>
        </div>
        <ClockSandbox initialNow={new Date().toISOString()} />
      </main>
      <SiteFooter />
    </>
  );
}
