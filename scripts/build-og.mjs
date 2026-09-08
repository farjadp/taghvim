// ============================================================================
// Source: scripts/build-og.mjs
// Version: 0.9.6 — 2026-09-08
// Why: Renders the social preview image. Deliberately a real browser and not
//      next/og: satori does not do Arabic-script shaping, so «تقویم» would come
//      out as disconnected letters. Chromium is already here for Playwright and
//      renders the same fonts the site uses.
// Env / Deps: Playwright's chromium, @fontsource/vazirmatn from node_modules.
//      Run `npm run build:og` after changing the mark or the wording; the PNGs
//      are committed and served statically by Next's file conventions.
// ============================================================================

import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
// Deliberately NOT app/opengraph-image.png: that file convention emits the
// image tags but not og:image:alt, and its .alt.txt sibling was ignored here.
// One file in public/, declared in app/layout.tsx, keeps the alt text and stops
// the same picture being committed twice.
const OUTPUT = 'public/og.png';

// The tokens are duplicated here on purpose: this runs outside the bundler, so
// it cannot import globals.css. Keep them equal to --color-paper, --color-forest
// and --color-clay, or the card stops looking like the site it previews.
const PAPER = '#f7f8f4';
const FOREST = '#214f40';
const CLAY = '#a9503b';
const MUTED = '#5c6a61';

const [mark, regular, bold] = await Promise.all([
  readFile(join(root, 'src/app/icon.svg'), 'utf8'),
  readFile(join(root, 'node_modules/@fontsource/vazirmatn/files/vazirmatn-arabic-400-normal.woff')),
  readFile(join(root, 'node_modules/@fontsource/vazirmatn/files/vazirmatn-arabic-800-normal.woff')),
]);

const font = (data) => `url(data:font/woff;base64,${data.toString('base64')}) format('woff')`;

const html = `<!doctype html>
<html dir="rtl" lang="fa"><head><meta charset="utf-8"><style>
  @font-face { font-family: Vazirmatn; font-weight: 400; src: ${font(regular)}; }
  @font-face { font-family: Vazirmatn; font-weight: 800; src: ${font(bold)}; }
  * { margin: 0; box-sizing: border-box; }
  body {
    width: 1200px; height: 630px; position: relative;
    display: flex; flex-direction: column; align-items: flex-start; justify-content: center; gap: 34px;
    padding: 0 96px; background: ${PAPER}; color: ${FOREST};
    font-family: Vazirmatn, sans-serif; -webkit-font-smoothing: antialiased;
  }
  .brand { display: flex; align-items: center; gap: 20px; }
  .brand svg { width: 84px; height: 84px; }
  .name { font-size: 66px; font-weight: 800; line-height: 1; }
  .dot { color: ${CLAY}; margin-right: 10px; }
  .tagline { font-size: 72px; font-weight: 800; line-height: 1.35; }
  .what { font-size: 30px; font-weight: 400; line-height: 1.95; color: ${MUTED}; max-width: 1008px; }
  .foot { display: flex; align-items: center; gap: 24px; margin-top: 10px; width: 100%; max-width: 1008px; }
  .rule { flex: 1; height: 2px; background: ${FOREST}; opacity: 0.14; }
  .domain { font-size: 34px; font-weight: 800; direction: ltr; letter-spacing: 0.01em; }
  /* The hero's sunrise, whole rather than cropped, sitting behind the left edge */
  .frame { position: absolute; inset: 0; overflow: hidden; }
  .sun { position: absolute; top: 50%; left: -130px; width: 560px; height: 560px;
         transform: translateY(-50%); opacity: 0.08; }
</style></head>
<body>
  <div class="frame"><svg class="sun" viewBox="0 0 250 240" fill="none" stroke="${FOREST}">
    <path d="M30 232V121a95 95 0 0 1 190 0v111M43 232V121a82 82 0 0 1 164 0v111M56 232V121a69 69 0 0 1 138 0v111" stroke-width=".8"/>
    <circle cx="125" cy="120" r="30"/><circle cx="125" cy="120" r="24" stroke-dasharray="1 4"/>
    <path d="M18 176h214M18 185h214M18 194h214" stroke-width=".8"/>
  </svg></div>
  <div class="brand">${mark.replace('width="64" height="64"', '')}<span class="name">تقویم<span class="dot">.</span></span></div>
  <p class="tagline">روزها را بهتر ببین</p>
  <p class="what">شمسی، میلادی و قمری کنار هم، با مناسبت‌ها و ابزارهای تاریخ.<br>بدون ثبت‌نام، بدون تبلیغات.</p>
  <div class="foot"><span class="domain">taghv.im</span><span class="rule"></span></div>
</body></html>`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
await page.setContent(html, { waitUntil: 'load' });
await page.evaluate(() => document.fonts.ready);
if (process.env.OG_DEBUG) {
  console.log(JSON.stringify(await page.evaluate(() => ({
    htmlScrollWidth: document.documentElement.scrollWidth,
    bodyRect: document.body.getBoundingClientRect().toJSON(),
    children: [...document.body.children].map((el) => ({ cls: el.className, ...el.getBoundingClientRect().toJSON() })),
  })), null, 1));
}
await page.screenshot({ path: join(root, OUTPUT) });
await browser.close();

const bytes = (await readFile(join(root, OUTPUT))).length;
console.log(`wrote ${OUTPUT} (1200x630, ${bytes} bytes)`);
