// ============================================================================
// Source: src/app/layout.tsx
// Version: 0.2.0 — 2026-09-07
// Why: Root layout: RTL Persian document, global styles, site metadata.
// Env / Deps: Next.js Metadata API; globals.css (Vazirmatn is imported there).
// ============================================================================

import type { Metadata } from "next";
import "./globals.css";

// metadataBase lets relative OG/canonical URLs resolve against the production origin.
export const metadata: Metadata = {
  metadataBase: new URL("https://taghv.im"),
  title: "تقویم | روزها را بهتر ببین",
  description: "تقویم ایرانی، تاریخ امروز، تبدیل تاریخ شمسی و میلادی، مناسبت‌ها و اوقات شرعی شهرهای ایران. بدون ثبت‌نام.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fa" dir="rtl">
      <body>{children}</body>
    </html>
  );
}
