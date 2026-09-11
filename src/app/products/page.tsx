// ============================================================================
// Source: src/app/products/page.tsx
// Version: 0.9.37 — 2026-09-11
// Why: «دیگر محصولات ما», reached from the footer: the other things the people
//      behind Taghvim run. Three, as Farjad listed them on 11 Sep; each is a
//      name, one sentence and its address, so nothing here needs updating
//      when those sites change.
// Env / Deps: Static server component; SiteHeader/SiteFooter like /about.
// ============================================================================

import type { Metadata } from "next";
import { ArrowUpLeft } from "lucide-react";
import { breadcrumbStructuredData, pageMetadata } from "@/lib/seo";
import { StructuredData } from "@/components/structured-data";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export const metadata: Metadata = pageMetadata({
  title: "دیگر محصولات ما | تقویم",
  description: "کارهای دیگر سازندگان تقویم: اشاویید، ویزارودز و وب‌سایت فرجاد پورمحمد.",
  path: "/products",
});

const PRODUCTS = [
  {
    name: "اشاویید",
    href: "https://www.ashavid.ca",
    host: "ashavid.ca",
    text: "شرکت فناوری و هوش مصنوعی. تقویم زیر همین شرکت ساخته شده است.",
  },
  {
    name: "ویزارودز",
    href: "https://visaroads.com",
    host: "visaroads.com",
    text: "منتورینگ استارتاپ در دوره‌های گروهی هشت‌هفته‌ای، از کشف مشتری تا اعتبارسنجی ایده.",
  },
  {
    name: "فرجاد پورمحمد",
    href: "https://farjadp.com",
    host: "farjadp.com",
    text: "وب‌سایت شخصی سازندهٔ تقویم.",
  },
];

export default function ProductsPage() {
  return (
    <>
      <SiteHeader />
      <StructuredData data={breadcrumbStructuredData("دیگر محصولات ما", "/products")} />
      <main className="mx-auto max-w-[820px] px-5 pt-12 pb-16 sm:px-8">
        <div className="mb-10">
          <h1 className="text-3xl font-extrabold text-forest sm:text-4xl">دیگر محصولات ما</h1>
          <p className="mt-3 text-sm leading-7 text-muted">کارهای دیگر سازندگان تقویم.</p>
        </div>

        <ul className="grid gap-4">
          {PRODUCTS.map((product) => (
            <li key={product.href}>
              <a
                href={product.href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start justify-between gap-4 rounded-xl border border-line bg-surface p-5 transition-colors hover:border-forest/30 hover:bg-leaf/40"
              >
                <div>
                  <h2 className="text-base font-semibold text-ink">{product.name}</h2>
                  <p className="mt-1.5 text-sm leading-7 text-muted">{product.text}</p>
                  <p className="mt-2 text-xs text-forest" dir="ltr">{product.host}</p>
                </div>
                <ArrowUpLeft size={16} className="mt-1 shrink-0 text-muted" />
              </a>
            </li>
          ))}
        </ul>
      </main>
      <SiteFooter />
    </>
  );
}
