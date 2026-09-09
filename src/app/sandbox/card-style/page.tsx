// ============================================================================
// Source: src/app/sandbox/card-style/page.tsx
// Version: 0.1.0 — 2026-09-09
// Why: SANDBOX route for the card's background. Unlinked and noindex.
// Env / Deps: Reads the folder on the server, the way app/page.tsx does.
//      Delete this file and src/components/sandbox-card-style.tsx to drop it.
// ============================================================================

import type { Metadata } from "next";
import { SandboxCardStyle } from "@/components/sandbox-card-style";
import { listBackgrounds } from "@/lib/backgrounds";

export const metadata: Metadata = { robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default function CardStyleSandboxPage() {
  return <SandboxCardStyle initialNow={new Date().toISOString()} backgrounds={listBackgrounds()} />;
}
