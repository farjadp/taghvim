// ============================================================================
// Source: src/app/sandbox/settings-panel/page.tsx
// Version: 0.1.0 — 2026-09-10
// Why: SANDBOX route for three ways out of the settings-panel overflow (B1).
//      Unlinked and noindex. Delete this file and components/sandbox-settings-
//      panel.tsx to drop it once a variant is picked.
// Env / Deps: none beyond the sandbox component.
// ============================================================================

import type { Metadata } from "next";
import { SandboxSettingsPanel } from "@/components/sandbox-settings-panel";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default function SettingsPanelSandboxPage() {
  return <SandboxSettingsPanel />;
}
