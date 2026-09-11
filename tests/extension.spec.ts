// ============================================================================
// Source: tests/extension.spec.ts
// Version: 0.9.22 — 2026-09-09
// Why: Loads the BUILT new-tab page — the same files the browser would load —
//      from a throwaway static server with every other origin blocked, and
//      reads the Tehran date off it. A build that needs the network, or that
//      paints the wrong day, fails here rather than on someone's new tab.
//      Runs twice: the Chrome package under `desktop`, the Firefox package
//      under `firefox`. The bundle is the same in both, but the renderer is
//      not, and Gecko is the half nothing else in this repo exercises.
//      The day-card button reached the extension by being inside TodayHero,
//      which the shell imports — so it arrived with no test of its own here.
//      It has one now, because "the image is drawn locally" is the claim the
//      whole package rests on and it is the one feature that could break it.
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

test("keeps the whole month on the first screen, with the tools below it", async ({ page }) => {
  // Adding the tools box inside the pinned viewport block split the height with the
  // calendar and cut the month off half way down — visible in the store screenshot
  // before anyone reported it. The first screen has to stay what it always was.
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto(`${origin}/newtab.html`);
  const cells = page.locator('button[aria-label*="۱۴۰۵"]');
  await expect(cells).toHaveCount(35);
  const offscreen = await cells.evaluateAll((nodes, height) =>
    nodes.filter((node) => node.getBoundingClientRect().bottom > height + 0.5).length, 800);
  expect(offscreen).toBe(0);
  // …and the tools box is real, just below the fold
  await expect(page.locator("#tools")).toHaveCount(1);
  const scrollable = await page.evaluate(() => document.documentElement.scrollHeight - window.innerHeight);
  expect(scrollable).toBeGreaterThan(0);
});

test("carries the same tools box, with its own separate list of dates", async ({ page }) => {
  await page.goto(`${origin}/newtab.html`);
  const tabs = page.getByRole("tab");
  await expect(tabs).toHaveCount(6);
  for (const name of ["تعطیلات پیوسته", "روزشمار", "تاریخ‌های من", "تبدیل تاریخ‌ها", "فاصلهٔ دو تاریخ", "محاسبهٔ سن"]) {
    await expect(page.getByRole("tab", { name })).toBeVisible();
  }

  // …and every one of them reachable without scrolling. Dropped into the narrow
  // column the strip got 324px for the 726 it needs, and four tabs sat behind a
  // scroll with nothing on screen to say so.
  const hidden = await page.locator('[role="tablist"]').evaluate((list) => {
    const box = list.getBoundingClientRect();
    return [...list.querySelectorAll('[role="tab"]')]
      .filter((tab) => { const r = tab.getBoundingClientRect(); return r.left < box.left - 0.5 || r.right > box.right + 0.5; })
      .map((tab) => tab.textContent?.trim());
  });
  expect(hidden).toEqual([]);

  // A tool that only computes: no network, so it works here exactly as on the site
  await page.getByRole("tab", { name: "محاسبهٔ سن" }).click();
  await expect(page.locator("#tools")).toBeVisible();

  // The extension page is its own origin, so its list is a SECOND list. The notice has
  // to say that outright — «this browser and this device» alone would mislead.
  await page.getByRole("tab", { name: "تاریخ‌های من" }).click();
  await page.getByText("این تاریخ‌ها کجا ذخیره می‌شوند").click();
  await expect(page.locator("#tools")).toContainText("با تاریخ‌هایی که در taghv.im ثبت کرده‌ای یکی نیست");
});

test("names its own build at the foot of the page", async ({ page }, testInfo) => {
  // The store rolls an update out over hours, so «am I on the new one» has to be
  // answerable from the page itself. The version is stamped from the manifest at
  // build time, which is also what the store serves — a stale stamp fails here.
  await page.goto(`${origin}/newtab.html`);
  // `dist` belongs to the server setup; resolve this project's directory the same way.
  const dir = (DIST[testInfo.project.name as keyof typeof DIST] ?? DIST.desktop).dir;
  const manifest = JSON.parse(readFileSync(join(dir, "manifest.json"), "utf8")) as { version: string };
  const footer = page.locator("footer");
  const digits = manifest.version.replace(/[0-9]/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[Number(d)]);
  await expect(footer).toContainText(`نسخهٔ ${digits}`);
  // …and a date beside it, written the way every other date in the app is
  await expect(footer).toContainText(/\d|[۰-۹]/);
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

  // The FIRST SCREEN must still hold everything a new tab is for, at a common laptop
  // size. It used to be the whole page and never scrolled; since 0.9.28 the tools box
  // Farjad asked for lives below it, so the page scrolls to reach the tools and the
  // test asserts the month instead: «keeps the whole month on the first screen».
  const main = await page.locator("#main").boundingBox();
  expect(main && main.y + main.height <= 800 + 0.5, "the pinned first screen runs past the fold").toBe(true);
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

test("draws the day as an image without leaving the page", async ({ page }) => {
  // The card is shared where the browser offers a share sheet and downloaded
  // where it does not. Real Chrome on macOS DOES offer one from an extension
  // page — `navigator.canShare({files})` is true there — so the sheet, which
  // no automation can dismiss, is taken out of the way and the fallback is
  // what gets asserted. The share branch hands the same File to the browser.
  await page.addInitScript(() => { Object.defineProperty(navigator, "canShare", { value: undefined }); });

  const foreign: string[] = [];
  page.on("request", (request) => { if (!request.url().startsWith(origin)) foreign.push(request.url()); });
  await page.goto(`${origin}/newtab.html`);

  const button = page.getByRole("button", { name: "تصویر امروز" });
  await expect(button).toBeVisible();
  const download = page.waitForEvent("download", { timeout: 15000 });
  await button.click();
  const file = await download;
  expect(file.suggestedFilename()).toMatch(/^taghvim-\d{4}-\d{2}-\d{2}\.png$/);
  await expect(page.getByRole("status").filter({ hasText: "تصویر" })).toContainText("تصویر ذخیره شد");

  // A real PNG at the size the card is drawn at, not an empty blob: the first
  // eight bytes are the signature and IHDR carries the dimensions.
  const stream = await file.createReadStream();
  const chunks: Buffer[] = [];
  for await (const chunk of stream) chunks.push(chunk as Buffer);
  const bytes = Buffer.concat(chunks);
  expect(bytes.subarray(0, 8)).toEqual(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  expect([bytes.readUInt32BE(16), bytes.readUInt32BE(20)]).toEqual([1080, 1080]);

  // The whole point: the image is produced in the browser, so a package that
  // promises no network must not have started making one to draw it.
  expect(foreign, "the page reached outside its own origin").toEqual([]);
});
