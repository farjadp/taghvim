// ============================================================================
// Source: src/app/sandbox/hero/page.tsx
// Version: 0.8.0-sandbox — 2026-09-07
// Why: SANDBOX for the chosen layout (J) and the open question inside it:
//      how the zodiac sign should be drawn. Unlinked and noindex, and no
//      live page imports anything from here.
// Env / Deps: components/sandbox-hero. Deleting src/app/sandbox and
//      src/components/sandbox-hero.tsx removes this with no other change.
// ============================================================================

import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { HeroSandbox } from "@/components/sandbox-hero";

export const metadata: Metadata = {
  title: "آزمایش برج فلکی | تقویم",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default function HeroSandboxPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-[1240px] px-4 pt-10 pb-16 sm:px-8">
        <div className="mb-8 rounded-2xl border border-clay/40 bg-holiday px-6 py-5">
          <h1 className="text-xl font-bold text-clay">آزمایشگاه · برج فلکی</h1>
          <p className="mt-2 text-sm leading-7 text-ink">
            چیدمان «ج» انتخاب شد: ساعت شهرها داخل کارت سبز، برج فلکی زیر میلادی و قمری در کارت سفید.
            آنچه هنوز باز است، شکل کشیدن نشان برج است. سه حالت اینجاست؛ زیر هرکدام قد واقعی همان لحظه نوشته شده.
          </p>
        </div>
        <HeroSandbox initialNow={new Date().toISOString()} />
      </main>
      <SiteFooter />
    </>
  );
}
