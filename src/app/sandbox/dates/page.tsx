// ============================================================================
// Source: src/app/sandbox/dates/page.tsx
// Version: 0.1.0 — 2026-09-09
// Why: SANDBOX route for the personal dates. Unlinked and noindex.
// Env / Deps: Delete this file, src/components/sandbox-dates.tsx and
//      CalendarPanel's `marked` prop to drop the sandbox.
// ============================================================================

import type { Metadata } from "next";
import { SandboxDates } from "@/components/sandbox-dates";

export const metadata: Metadata = { robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default function DatesSandboxPage() {
  return <SandboxDates initialNow={new Date().toISOString()} />;
}
