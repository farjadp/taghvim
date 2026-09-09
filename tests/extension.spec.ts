// ============================================================================
// Source: tests/extension.spec.ts
// Version: 0.9.15 — 2026-09-09
// Why: Loads the BUILT new-tab page — the same files the browser would load —
//      from a throwaway static server with every other origin blocked, and
//      reads the Tehran date off it. A build that needs the network, or that
//      paints the wrong day, fails here rather than on someone's new tab.
//      Runs twice: the Chrome package under `desktop`, the Firefox package
//      under `firefox`. The bundle is the same in both, but the renderer is
//      not, and Gecko is the half nothing else in this repo exercises.
// Env / Deps: The desktop and firefox Playwright projects (a new tab is a
//      desktop surface). Builds whichever dist is missing.
// ============================================================================

import { execSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { createServer, type Server } from "node:http";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";
import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

// The package is ESM, so there is no __dirname here.
const DIST = {
  desktop: { dir: fileURLToPath(new URL("../extension/dist", import.meta.url)), build: "build:extension" },
  firefox: { dir: fileURLToPath(new URL("../extension/dist-firefox", import.meta.url)), build: "build:extension:firefox" },
} as const;
const MIME: Record<string, string> = {
  ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css",
  ".woff2": "font/woff2", ".png": "image/png", ".svg": "image/svg+xml", ".json": "application/json",
};

let server: Server;
let origin: string;

test.beforeAll(async ({}, testInfo) => {
  // Each project serves its own package, so "the files the browser would load"
  // stays literally true for both stores.
  const target = DIST[testInfo.project.name as keyof typeof DIST] ?? DIST.desktop;
  const dist = target.dir;
  if (!existsSync(join(dist, "manifest.json"))) execSync(`npm run ${target.build}`, { stdio: "inherit" });
  server = createServer((request, response) => {
    // Serve from dist only; a path that escapes it is a 404, not a file read.
    const path = normalize(decodeURIComponent((request.url ?? "/").split("?")[0]));
    const file = join(dist, path === "/" ? "/newtab.html" : path);
    if (!file.startsWith(dist) || !existsSync(file)) { response.writeHead(404); response.end(); return; }
    response.writeHead(200, { "Content-Type": MIME[extname(file)] ?? "application/octet-stream" });
    response.end(readFileSync(file));
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  origin = `http://127.0.0.1:${typeof address === "object" && address ? address.port : 0}`;
});
test.afterAll(() => new Promise<void>((resolve) => server.close(() => resolve())));

test.beforeEach(async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === "mobile", "a new tab is a desktop surface");
  await page.setViewportSize({ width: 1280, height: 800 });
  // 6 Sep 2026, 14:00 Tehran — the same frozen instant the site's tests use
  await page.clock.install({ time: new Date("2026-09-06T10:30:00Z") });
});

test("paints the Tehran date from its own files with every other origin blocked", async ({ page }) => {
  const foreign: string[] = [];
  await page.route("**/*", (route) => {
    const url = route.request().url();
    if (url.startsWith(origin)) return route.continue();
    foreign.push(url);
    return route.abort("blockedbyclient");
  });

  await page.goto(`${origin}/newtab.html`);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("۱۵ شهریور ۱۴۰۵");
  await expect(page.getByRole("region", { name: "تقویم ماهانه" })).toBeVisible();
  // Three switches: the memorial is not rendered here, so its switch is not either
  await expect(page.getByTestId("view-controls").getByRole("switch")).toHaveCount(3);
  expect(foreign, "the page reached outside its own origin").toEqual([]);

  // The whole point of a new tab: no page scroll at a common laptop size
  expect(await page.evaluate(() => document.documentElement.scrollHeight <= window.innerHeight)).toBe(true);
});

test("applies a stored dark theme before React runs", async ({ page }) => {
  // Stored the way the settings menu stores it, then loaded cold: boot.js must
  // have set the attribute by the time the first script module runs.
  await page.addInitScript(() => localStorage.setItem("taghvim-theme", "dark"));
  await page.goto(`${origin}/newtab.html`);
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  const audit = await new AxeBuilder({ page }).include("main").withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
  expect(audit.violations.map(({ id }) => id)).toEqual([]);
});

test("the built page passes accessibility checks in light mode", async ({ page }) => {
  await page.goto(`${origin}/newtab.html`);
  const audit = await new AxeBuilder({ page }).include("main").withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
  expect(audit.violations.map(({ id }) => id)).toEqual([]);
});
