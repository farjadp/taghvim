// ============================================================================
// Source: playwright.config.ts
// Version: 0.2.0 — 2026-09-07
// Why: Playwright configuration: two device projects and the dev-server hook.
// Env / Deps: Starts `npm run dev -- --port 3100`; port 3000 is reserved on this machine.
// ============================================================================

import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  use: { baseURL: "http://127.0.0.1:3100", trace: "retain-on-failure" },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["iPhone 13"], defaultBrowserType: "chromium" } },
  ],
  webServer: {
    command: "npm run dev -- --port 3100",
    url: "http://127.0.0.1:3100",
    reuseExistingServer: !process.env.CI,
  },
});
