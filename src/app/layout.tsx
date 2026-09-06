import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
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
