// ============================================================================
// Source: src/app/sandbox/iran/page.tsx
// Version: 0.1.0 — 2026-09-11
// Why: SANDBOX for pre-Islamic Iranian motifs on the hero card. Unlinked and
//      noindex. Delete with components/sandbox-iran.tsx once Farjad has picked.
// Env / Deps: components/sandbox-iran.
// ============================================================================

import type { Metadata } from "next";
import { SandboxIran } from "@/components/sandbox-iran";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default function IranSandboxPage() {
  return (
    <main className="mx-auto max-w-[900px] px-5 py-10">
      <h1 className="mb-1 text-lg font-semibold text-ink">نقش‌های ایران کهن روی کارت امروز</h1>
      <p className="mb-8 text-xs text-muted">هر نقش روی هر چهار رنگ. عدد کنار عنوان، حجمی است که نقش به صفحه اضافه می‌کند.</p>
      <SandboxIran />
    </main>
  );
}
