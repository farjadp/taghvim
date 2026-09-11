// ============================================================================
// Source: src/app/sandbox/header/[variant]/page.tsx
// Version: 0.1.0 — 2026-09-11
// Why: SANDBOX. One header variant on its own page, so the sandbox can show it
//      in an iframe at a real phone width. Unlinked and noindex.
// Env / Deps: components/sandbox-header.
// ============================================================================

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { HEADER_VARIANTS, SandboxHeader, type HeaderVariant } from "@/components/sandbox-header";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function HeaderVariantPage({ params }: { params: Promise<{ variant: string }> }) {
  const { variant } = await params;
  if (!HEADER_VARIANTS.includes(variant as HeaderVariant)) notFound();
  return (
    <>
      <SandboxHeader variant={variant as HeaderVariant} />
      <p className="px-5 py-4 text-sm text-muted">متن صفحه از اینجا شروع می‌شود.</p>
    </>
  );
}
