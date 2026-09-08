// ============================================================================
// Source: vitest.config.ts
// Version: 0.9.1 — 2026-09-08
// Why: Vitest configuration: unit tests live beside their modules in src/lib.
//      The "@/" alias mirrors tsconfig so route files under src/app, which use
//      it, can be imported by tests the same way the app imports them.
// Env / Deps: Node environment; no DOM needed.
// ============================================================================

import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: { include: ["src/**/*.test.ts"] },
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
});
