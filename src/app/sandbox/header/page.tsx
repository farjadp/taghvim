// ============================================================================
// Source: src/app/sandbox/header/page.tsx
// Version: 0.1.0 — 2026-09-11
// Why: SANDBOX for the secondary pages' header on narrow phones. Unlinked and
//      noindex. Delete with components/sandbox-header*.tsx and the [variant]
//      route once Farjad has picked.
// Env / Deps: components/sandbox-header-frames.
// ============================================================================

import type { Metadata } from "next";
import { SandboxHeaderFrames } from "@/components/sandbox-header-frames";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default function HeaderSandboxPage() {
  return <SandboxHeaderFrames />;
}
