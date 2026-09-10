// ============================================================================
// Source: src/app/sandbox/memorial-mark/page.tsx
// Version: 0.1.0 — 2026-09-10
// Why: SANDBOX. Three marks for «جاویدنامان», at the sizes the interface really
//      uses. Unlinked and noindex. Delete with the component once one is picked.
// ============================================================================

import type { Metadata } from "next";
import { SandboxMemorialMark } from "@/components/sandbox-memorial-mark";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default function MemorialMarkSandboxPage() {
  return <SandboxMemorialMark />;
}
