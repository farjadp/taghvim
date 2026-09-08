// ============================================================================
// Source: playwright.config.ts
// Version: 0.9.0 — 2026-09-08
// Why: Playwright configuration: two device projects and the dev-server hook.
// Env / Deps: E2E_PORT defaults to 3100; sandbox worktrees use a separate port.
//      Port 3000 is reserved on this machine.
// ============================================================================

import { defineConfig, devices } from "@playwright/test";

const port = process.env.E2E_PORT ?? "3100";
const baseURL = `http://127.0.0.1:${port}`;

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  use: { baseURL, trace: "retain-on-failure" },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["iPhone 13"], defaultBrowserType: "chromium" } },
  ],
  webServer: {
    command: `npm run dev -- --port ${port}`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
  },
});
