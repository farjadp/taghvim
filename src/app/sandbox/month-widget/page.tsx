// ============================================================================
// Source: src/app/sandbox/month-widget/page.tsx
// Version: 0.1.0 — 2026-10-10
// Why: SANDBOX for an Android month widget, asked for on X («ویجت خوب با جذابیت
//      بصری»). Unlinked and noindex. Delete with components/sandbox-month-widget.tsx
//      once Farjad has picked.
// Env / Deps: components/sandbox-month-widget.
// ============================================================================

import type { Metadata } from "next";
import { SandboxMonthWidget } from "@/components/sandbox-month-widget";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default function MonthWidgetSandboxPage() {
  return (
    <main className="mx-auto max-w-[1180px] px-4 py-10 sm:px-8">
      <h1 className="mb-1 text-lg font-semibold text-ink">ویجت نمای ماه — اندروید</h1>
      <p className="mb-8 text-xs leading-6 text-muted">
        سه شکل، با دادهٔ واقعی و رنگ‌های ویجت‌های فعلی. هر قاب به اندازهٔ کوچک‌ترین جایی است که اندروید به آن اندازه از ویجت می‌دهد (dp، عمودی)، پس روی بیشتر گوشی‌ها کمی جادارتر است. قلم، قلم سیستم است، چون ویجت اندروید قلم اختصاصی نمی‌گیرد؛ روی گوشی Noto Sans Arabic خواهد بود. زیر هر کدام اندازه‌ها همین حالا اندازه گرفته می‌شود. یک ماه شش‌ردیفه را هم امتحان کن.
      </p>
      <SandboxMonthWidget />
    </main>
  );
}
