// ============================================================================
// Source: src/app/sandbox/widgets/page.tsx
// Version: 0.1.0 — 2026-09-10
// Why: SANDBOX for the three widgets the apps promise on /download: small,
//      wide, lock screen — three designs each, drawn at the official sizes.
//      Unlinked and noindex. Delete with components/sandbox-widgets.tsx once
//      Farjad has picked.
// Env / Deps: Dynamic, so «today» is the real Tehran day.
// ============================================================================

import type { Metadata } from "next";
import { SandboxWidgets } from "@/components/sandbox-widgets";

export const metadata: Metadata = { robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default function WidgetsSandboxPage() {
  return <SandboxWidgets initialNow={new Date().toISOString()} />;
}
