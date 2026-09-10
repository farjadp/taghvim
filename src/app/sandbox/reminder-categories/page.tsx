// ============================================================================
// Source: src/app/sandbox/reminder-categories/page.tsx
// Version: 0.1.0 — 2026-09-10
// Why: SANDBOX for the reminder categories — colour, icon and wording for each,
//      in both themes, with the contrast of every pair worked out rather than
//      trusted. Unlinked and noindex.
// Env / Deps: Delete this file and components/sandbox-reminder-categories.tsx
//      once the set is picked.
// ============================================================================

import type { Metadata } from "next";
import { SandboxReminderCategories } from "@/components/sandbox-reminder-categories";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default function ReminderCategoriesSandboxPage() {
  return <SandboxReminderCategories />;
}
