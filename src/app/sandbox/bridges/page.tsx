// ============================================================================
// Source: src/app/sandbox/bridges/page.tsx
// Version: 0.2.0 — 2026-09-09
// Why: SANDBOX route for the bridges panel's placement. Unlinked and noindex.
// Env / Deps: Passes the server instant in, the way app/page.tsx does, so the
//      first paint is not the build time. Delete this file and
//      src/components/sandbox-bridges.tsx to drop the sandbox.
// ============================================================================

import type { Metadata } from "next";
import { SandboxBridges } from "@/components/sandbox-bridges";

// Never indexed and never listed in routes.ts: a sandbox is a decision aid, not a page.
export const metadata: Metadata = { robots: { index: false, follow: false } };
// The date has to be today's, not the build's.
export const dynamic = "force-dynamic";

export default function BridgesSandboxPage() {
  return <SandboxBridges initialNow={new Date().toISOString()} />;
}
