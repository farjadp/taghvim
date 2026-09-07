// ============================================================================
// Source: vitest.config.ts
// Version: 0.2.0 — 2026-09-07
// Why: Vitest configuration: unit tests live beside their modules in src/lib.
// Env / Deps: Node environment; no DOM needed.
// ============================================================================

import { defineConfig } from "vitest/config";

export default defineConfig({
  test: { include: ["src/**/*.test.ts"] },
});
