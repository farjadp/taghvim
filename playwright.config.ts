// ============================================================================
// Source: playwright.config.ts
// Version: 0.9.15 — 2026-09-09
// Why: Playwright configuration: the device projects and the dev-server hook.
//      The `firefox` project exists for one reason — the extension also ships
//      to Firefox, and a linter that passes says nothing about whether Gecko
//      paints the page. It runs the extension spec only, against the Firefox
//      build, so the site's suite is not doubled for no gain.
// Env / Deps: E2E_PORT defaults to 3100; sandbox worktrees use a separate port.
//      Port 3000 is reserved on this machine. The firefox project needs
//      `npx playwright install firefox`.
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
    // The extension only; the site is served to whatever browser a visitor
    // brings, but the add-on is a package we hand to Mozilla.
    { name: "firefox", testMatch: /extension\.spec\.ts/, use: { ...devices["Desktop Firefox"] } },
  ],
  webServer: {
    command: `npm run dev -- --port ${port}`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
  },
});
