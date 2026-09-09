// ============================================================================
// Source: src/app/sandbox/countdown/page.tsx
// Version: 0.1.0 — 2026-09-09
// Why: SANDBOX route for the countdown in the hero. Unlinked and noindex.
// Env / Deps: Delete this file and src/components/sandbox-countdown.tsx to
//      drop the sandbox. Dynamic, so the count is from today.
// ============================================================================

import type { Metadata } from "next";
import { SandboxCountdown } from "@/components/sandbox-countdown";

export const metadata: Metadata = { robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default function CountdownSandboxPage() {
  return <SandboxCountdown initialNow={new Date().toISOString()} />;
}
