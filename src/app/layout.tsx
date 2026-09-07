// ============================================================================
// Source: src/app/layout.tsx
// Version: 0.4.0 — 2026-09-07
// Why: Root layout: RTL Persian document, global styles, site metadata.
// Env / Deps: Next.js Metadata API; globals.css (Vazirmatn is imported there).
// ============================================================================

import type { Metadata } from "next";
import "./globals.css";
import { PREFERENCES_BOOT_SCRIPT } from "@/lib/preferences";

// metadataBase lets relative OG/canonical URLs resolve against the production origin.
export const metadata: Metadata = {
  metadataBase: new URL("https://taghv.im"),
  title: "تقویم | روزها را بهتر ببین",
  description: "تقویم ایرانی، تاریخ امروز، تبدیل تاریخ شمسی و میلادی، مناسبت‌ها و اوقات شرعی شهرهای ایران. بدون ثبت‌نام.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fa" dir="rtl" suppressHydrationWarning>
      {/* Applies stored theme/size/font before first paint; attributes are set client-side, hence suppressHydrationWarning */}
      <head><script dangerouslySetInnerHTML={{ __html: PREFERENCES_BOOT_SCRIPT }} /></head>
      <body>{children}</body>
    </html>
  );
}
