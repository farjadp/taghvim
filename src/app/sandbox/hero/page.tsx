// ============================================================================
// Source: src/app/sandbox/hero/page.tsx
// Version: 0.7.1-sandbox — 2026-09-07
// Why: SANDBOX. Three ways to stop the hero card from growing empty space
//      under the Tehran clock once the side card carries world clocks.
//      Unlinked and noindex. No live page imports anything from here.
// Env / Deps: components/sandbox-hero. Deleting src/app/sandbox and
//      src/components/sandbox-hero.tsx removes this with no other change.
// ============================================================================

import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { HeroSandbox } from "@/components/sandbox-hero";

export const metadata: Metadata = {
  title: "آزمایش ارتفاع کارت | تقویم",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default function HeroSandboxPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-[1240px] px-4 pt-10 pb-16 sm:px-8">
        <div className="mb-8 rounded-2xl border border-clay/40 bg-holiday px-6 py-5">
          <h1 className="text-xl font-bold text-clay">آزمایشگاه · فضای خالی زیر ساعت</h1>
          <p className="mt-2 text-sm leading-7 text-ink">
            کارت سبز و کارت سفید در یک ردیف گرید هستند، پس هم‌قد می‌شوند. کارت سفید بلندتر است،
            و ارتفاع اضافه در کارت سبز زیر ساعت جمع می‌شود. زیر هر نمونه، قد واقعی همان لحظه نوشته شده.
          </p>
        </div>
        <HeroSandbox initialNow={new Date().toISOString()} />
      </main>
      <SiteFooter />
    </>
  );
}
