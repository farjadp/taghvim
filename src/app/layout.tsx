// ============================================================================
// Source: src/app/layout.tsx
// Version: 0.9.7 — 2026-09-08
// Why: Root layout: RTL Persian document, global styles, site metadata.
// Env / Deps: Next.js Metadata API; globals.css (Vazirmatn is imported there).
// ============================================================================

import type { Metadata } from "next";
import "./globals.css";
import { PREFERENCES_BOOT_SCRIPT } from "@/lib/preferences";
import { SITE_ORIGIN } from "@/lib/routes";
import { pageMetadata, siteStructuredData } from "@/lib/seo";
import { StructuredData } from "@/components/structured-data";

// metadataBase lets relative OG/canonical URLs resolve against the production origin.
const TITLE = "تقویم | روزها را بهتر ببین";
const DESCRIPTION = "تاریخ امروز به شمسی، میلادی و قمری. تقویم ماهانه، مناسبت‌ها، تبدیل تاریخ و محاسبهٔ سن. بدون ثبت‌نام و بدون تبلیغات.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_ORIGIN),
  ...pageMetadata({ title: TITLE, description: DESCRIPTION, path: "/" }),
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fa" dir="rtl" suppressHydrationWarning>
      {/* Applies stored theme/size/font before first paint; attributes are set client-side, hence suppressHydrationWarning */}
      <head>
        <script dangerouslySetInnerHTML={{ __html: PREFERENCES_BOOT_SCRIPT }} />
        <StructuredData data={siteStructuredData(DESCRIPTION)} />
      </head>
      <body>{children}</body>
    </html>
  );
}
