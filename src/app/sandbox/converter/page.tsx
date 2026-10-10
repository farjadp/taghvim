// ============================================================================
// Source: src/app/sandbox/converter/page.tsx
// Version: 0.1.0 — 2026-10-09
// Why: SANDBOX for typing a date in words in «تبدیل تاریخ». Unlinked and
//      noindex. Delete with components/sandbox-converter.tsx once Farjad has picked.
// Env / Deps: components/sandbox-converter.
// ============================================================================

import type { Metadata } from "next";
import { SandboxConverter } from "@/components/sandbox-converter";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default function ConverterSandboxPage() {
  return (
    <main className="mx-auto max-w-[1180px] px-4 py-10 sm:px-8">
      <h1 className="mb-1 text-lg font-semibold text-ink">تبدیل تاریخ با نوشتن</h1>
      <p className="mb-8 text-xs leading-6 text-muted">سه شکل، هر کدام واقعاً کار می‌کند. زیر هر کدام ارتفاع و تعداد ایستگاه‌های Tab همین حالا اندازه گرفته می‌شود؛ پنجره را باریک کن تا عدد گوشی را ببینی.</p>
      <SandboxConverter />
    </main>
  );
}
