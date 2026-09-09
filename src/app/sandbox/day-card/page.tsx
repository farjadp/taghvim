// ============================================================================
// Source: src/app/sandbox/day-card/page.tsx
// Version: 0.1.0 — 2026-09-09
// Why: SANDBOX route for the day card. Unlinked and noindex.
// Env / Deps: Delete this file and src/components/sandbox-day-card.tsx to drop
//      the sandbox. Dynamic, so the card is today's.
// ============================================================================

import type { Metadata } from "next";
import { SandboxDayCard } from "@/components/sandbox-day-card";

export const metadata: Metadata = { robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default function DayCardSandboxPage() {
  return <SandboxDayCard initialNow={new Date().toISOString()} />;
}
