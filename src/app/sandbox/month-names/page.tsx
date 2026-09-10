// ============================================================================
// Source: src/app/sandbox/month-names/page.tsx
// Version: 0.1.0 — 2026-09-10
// Why: SANDBOX for the Avestan month names (#95). Unlinked and noindex.
//      Delete with components/sandbox-month-names.tsx once a placement is picked.
// ============================================================================

import type { Metadata } from "next";
import { SandboxMonthNames } from "@/components/sandbox-month-names";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default function MonthNamesSandboxPage() {
  return <SandboxMonthNames />;
}
