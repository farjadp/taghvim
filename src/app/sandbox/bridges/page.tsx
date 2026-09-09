// ============================================================================
// Source: src/app/sandbox/bridges/page.tsx
// Version: 0.1.0 — 2026-09-09
// Why: SANDBOX route for the holiday-bridges panel. Unlinked and noindex.
// Env / Deps: Delete this file and src/components/sandbox-bridges.tsx to drop
//      the idea; src/lib/bridges.ts is the shippable half and stands alone.
// ============================================================================

import type { Metadata } from "next";
import { SandboxBridges } from "@/components/sandbox-bridges";

// Never indexed and never listed in routes.ts: a sandbox is a decision aid, not a page.
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default function BridgesSandboxPage() {
  return <SandboxBridges />;
}
