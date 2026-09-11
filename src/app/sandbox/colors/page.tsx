// ============================================================================
// Source: src/app/sandbox/colors/page.tsx
// Version: 0.1.0 — 2026-09-11
// Why: SANDBOX for accent colour palettes alongside light/dark. Unlinked and
//      noindex. Delete with components/sandbox-colors.tsx once Farjad has picked.
// Env / Deps: components/sandbox-colors.
// ============================================================================

import type { Metadata } from "next";
import { SandboxColors } from "@/components/sandbox-colors";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default function ColorsSandboxPage() {
  return (
    <main className="mx-auto max-w-[900px] px-5 py-10">
      <h1 className="mb-1 text-lg font-semibold text-ink">رنگ‌بندی — پنج رنگ، هر کدام روشن و تیره</h1>
      <p className="mb-6 text-xs text-muted">حداقل قابل قبول برای متن ۴٫۵:۱ است. ✕ یعنی کمتر از حد. فاصلهٔ کمتر از ۲۵ درجه یعنی رنگ اصلی با قرمز تعطیل اشتباه گرفته می‌شود.</p>
      <SandboxColors />
    </main>
  );
}
