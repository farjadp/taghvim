// ============================================================================
// Source: src/app/sandbox/tahvil/page.tsx
// Version: 0.1.0 — 2026-09-10
// Why: SANDBOX for where the moment the year turns appears (#14). Unlinked and
//      noindex. Delete with components/sandbox-tahvil.tsx once one is picked.
// Env / Deps: Dynamic, so «now» is the real now and every countdown is live.
// ============================================================================

import type { Metadata } from "next";
import { SandboxTahvil } from "@/components/sandbox-tahvil";

export const metadata: Metadata = { robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default function TahvilSandboxPage() {
  return <SandboxTahvil initialNow={new Date().toISOString()} />;
}
