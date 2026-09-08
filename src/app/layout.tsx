// ============================================================================
// Source: src/app/layout.tsx
// Version: 0.9.6 — 2026-09-08
// Why: Root layout: RTL Persian document, global styles, site metadata.
// Env / Deps: Next.js Metadata API; globals.css (Vazirmatn is imported there).
// ============================================================================

import type { Metadata } from "next";
import "./globals.css";
import { PREFERENCES_BOOT_SCRIPT } from "@/lib/preferences";

// metadataBase lets relative OG/canonical URLs resolve against the production origin.
const TITLE = "تقویم | روزها را بهتر ببین";
const DESCRIPTION = "تاریخ امروز به شمسی، میلادی و قمری. تقویم ماهانه، مناسبت‌ها، تبدیل تاریخ و محاسبهٔ سن. بدون ثبت‌نام و بدون تبلیغات.";
// public/og.png is rendered by `npm run build:og`. It is declared here rather
// than left to the app/opengraph-image.png file convention, which emits the
// image tags but not og:image:alt.
const PREVIEW = {
  url: "/og.png",
  width: 1200,
  height: 630,
  alt: "تقویم — روزها را بهتر ببین. تقویم ایرانی برای وب، با تاریخ شمسی، میلادی و قمری کنار هم.",
};

export const metadata: Metadata = {
  metadataBase: new URL("https://taghv.im"),
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    type: "website",
    locale: "fa_IR",
    siteName: "تقویم",
    url: "/",
    title: TITLE,
    description: DESCRIPTION,
    images: [PREVIEW],
  },
  twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION, images: [PREVIEW] },
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
