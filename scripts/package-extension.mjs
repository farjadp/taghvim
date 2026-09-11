// ============================================================================
// Source: scripts/package-extension.mjs
// Version: 0.9.15 — 2026-09-09
// Why: Turns the built extension into what the two stores actually ask for.
//      Chrome: one ZIP, 1280x800 screenshots, the 128x128 icon and the two
//      promo tiles. Firefox/AMO: its own ZIP (different manifest) plus a
//      source ZIP — AMO REQUIRES the source of any bundled or minified
//      add-on, and rejects the submission without it. The screenshots are
//      rendered from the BUILT page in a real browser, so what the listing
//      shows is what the extension does, not a mockup; the tiles are drawn
//      from the same tokens as the site. Screenshots and tiles must be 24-bit
//      PNG with NO alpha — Chrome rejects alpha — which is what an opaque
//      page screenshot produces. AMO takes the same PNGs.
// Env / Deps: Playwright's chromium, `zip`, and `git` (the source ZIP is
//      `git archive HEAD`, so it is exactly the committed tree and nothing
//      local). Runs both builds first so no ZIP can be older than the source.
//      The ZIPs are git-ignored; the screenshots are committed, since the
//      listing should be reviewable.
// ============================================================================

import { execFileSync } from 'node:child_process';
import { createServer } from 'node:http';
import { existsSync, mkdirSync, readFileSync, rmSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { dirname, extname, join, normalize, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'extension/dist');
const store = join(root, 'extension/store');
const distFirefox = join(root, 'extension/dist-firefox');
const version = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')).version;

execFileSync('npm', ['run', 'build:extension'], { cwd: root, stdio: 'inherit' });
execFileSync('npm', ['run', 'build:extension:firefox'], { cwd: root, stdio: 'inherit' });

// --- the uploads -----------------------------------------------------------
// Zipped from inside each dist so the archive has no wrapping folder: both
// stores reject a package whose manifest.json is not at the root.
const zip = (name, cwd) => {
  const file = join(root, 'extension', name);
  rmSync(file, { force: true });
  execFileSync('zip', ['-r', '-q', '-X', file, '.'], { cwd });
  return { name, bytes: readFileSync(file).length };
};
const packages = [zip(`taghvim-${version}.zip`, dist), zip(`taghvim-${version}-firefox.zip`, distFirefox)];

// AMO will not accept a bundled add-on without the source that produced it.
// `git archive` is the committed tree exactly — no node_modules, no dist, no
// uncommitted local state — and AMO reviewers rebuild it from FIREFOX.md.
// Which is also the trap: an uncommitted tree means the ZIP above was built
// from source the source ZIP does not contain, and a reviewer who follows
// FIREFOX.md gets a different bundle. Commit first, then package.
const dirty = execFileSync('git', ['status', '--porcelain'], { cwd: root, encoding: 'utf8' }).trim();
if (dirty) {
  console.error('FAIL  the working tree is dirty, so the source ZIP would not match the packages built above.');
  console.error('      Commit first — AMO reviewers rebuild from what is in that ZIP.');
  for (const line of dirty.split('\n').slice(0, 20)) console.error(`      ${line}`);
  process.exit(1);
}
const sourceName = `taghvim-${version}-source.zip`;
rmSync(join(root, 'extension', sourceName), { force: true });
execFileSync('git', ['archive', '--format=zip', '-o', join(root, 'extension', sourceName), 'HEAD'], { cwd: root });
packages.push({ name: sourceName, bytes: readFileSync(join(root, 'extension', sourceName)).length });

// Mozilla's own linter, run here rather than discovered on upload. Errors are
// fatal; the warnings that remain are React's internal innerHTML writes and
// the Android minimum, both expected and both explained in FIREFOX.md.
const lint = JSON.parse(execFileSync('npx', ['--yes', 'addons-linter', '--output', 'json', distFirefox], { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }));
if (lint.summary.errors) {
  console.error(`FAIL  addons-linter: ${lint.summary.errors} error(s)`);
  for (const item of lint.errors) console.error(`      - ${item.code} ${item.file ?? 'manifest.json'}`);
  process.exit(1);
}

// The release workflow builds the uploads only. The listing images are for the
// store pages, not release artefacts, and would need a browser on the runner.
if (process.env.PACKAGE_NO_LISTING) {
  console.log('\nupload');
  for (const item of packages) console.log(`        extension/${item.name.padEnd(34)} ${Math.round(item.bytes / 1024)} KB`);
  console.log(`        addons-linter: 0 errors, ${lint.summary.warnings} warning(s)`);
  process.exit(0);
}

// --- the listing screenshots ------------------------------------------------
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.woff2': 'font/woff2', '.png': 'image/png', '.svg': 'image/svg+xml', '.json': 'application/json' };
const server = createServer((request, response) => {
  const path = normalize(decodeURIComponent((request.url ?? '/').split('?')[0]));
  const file = join(dist, path === '/' ? '/newtab.html' : path);
  if (!file.startsWith(dist) || !existsSync(file)) { response.writeHead(404); response.end(); return; }
  response.writeHead(200, { 'Content-Type': MIME[extname(file)] ?? 'application/octet-stream' });
  response.end(readFileSync(file));
});
await new Promise((done) => server.listen(0, '127.0.0.1', done));
const origin = `http://127.0.0.1:${server.address().port}`;

mkdirSync(store, { recursive: true });
const browser = await chromium.launch();
// 1280x800 is one of the two sizes the store accepts, and the one that shows
// the layout the extension is designed around.
const page = await browser.newPage({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 });
for (const theme of ['light', 'dark']) {
  await page.addInitScript((value) => localStorage.setItem('taghvim-theme', value), theme);
  await page.goto(`${origin}/newtab.html`);
  await page.evaluate(() => document.fonts.ready);
  // The clock ticks; wait for a whole second so the screenshot is not mid-paint.
  await page.waitForTimeout(1100);
  await page.screenshot({ path: join(store, `newtab-${theme}.png`) });
}

// --- the promo tiles --------------------------------------------------------
// Drawn, not screenshotted: a tile is marketing, and 440x280 is far too small
// to show a calendar grid legibly. Same tokens as the site, same mark, and
// Chromium so the Persian actually shapes — satori would not.
const PAPER = '#f7f8f4';
const FOREST = '#214f40';
const CLAY = '#a9503b';
const MUTED = '#5c6a61';
const mark = readFileSync(join(root, 'src/app/icon.svg'), 'utf8').replace('width="64" height="64"', '');
const fonts = await Promise.all([
  readFile(join(root, 'node_modules/@fontsource/vazirmatn/files/vazirmatn-arabic-400-normal.woff')),
  readFile(join(root, 'node_modules/@fontsource/vazirmatn/files/vazirmatn-arabic-800-normal.woff')),
]);
const face = (data, weight) => `@font-face{font-family:Vazirmatn;font-weight:${weight};src:url(data:font/woff;base64,${data.toString('base64')}) format('woff')}`;

const SUN = `<svg class="sun" viewBox="0 0 250 240" fill="none" stroke="${FOREST}">
  <path d="M30 232V121a95 95 0 0 1 190 0v111M43 232V121a82 82 0 0 1 164 0v111M56 232V121a69 69 0 0 1 138 0v111" stroke-width=".8"/>
  <circle cx="125" cy="120" r="30"/><circle cx="125" cy="120" r="24" stroke-dasharray="1 4"/>
  <path d="M18 176h214M18 185h214M18 194h214" stroke-width=".8"/></svg>`;

const tile = ({ width, height, pad, markSize, name, tagline, line, sun }) => `<!doctype html>
<html dir="rtl" lang="fa"><head><meta charset="utf-8"><style>
  ${face(fonts[0], 400)} ${face(fonts[1], 800)}
  *{margin:0;box-sizing:border-box}
  body{width:${width}px;height:${height}px;position:relative;display:flex;flex-direction:column;
       align-items:flex-start;justify-content:center;gap:${Math.round(height * 0.045)}px;
       padding:0 ${pad}px;background:${PAPER};color:${FOREST};
       font-family:Vazirmatn,sans-serif;-webkit-font-smoothing:antialiased}
  .brand{display:flex;align-items:center;gap:${Math.round(markSize * 0.22)}px}
  .brand svg{width:${markSize}px;height:${markSize}px}
  .name{font-size:${name}px;font-weight:800;line-height:1}
  .dot{color:${CLAY};margin-right:${Math.round(name * 0.14)}px}
  .tagline{font-size:${tagline}px;font-weight:800;line-height:1.3}
  .line{font-size:${line}px;font-weight:400;line-height:1.8;color:${MUTED};max-width:${width - pad * 2}px}
  .frame{position:absolute;inset:0;overflow:hidden}
  .sun{position:absolute;top:50%;left:${sun.left}px;width:${sun.size}px;height:${sun.size}px;
       transform:translateY(-50%);opacity:.08}
</style></head><body>
  <div class="frame">${SUN}</div>
  <div class="brand">${mark}<span class="name">تقویم<span class="dot">.</span></span></div>
  <p class="tagline">روزها را بهتر ببین</p>
  <p class="line">تب جدید، تقویم ایرانی. شمسی، میلادی و قمری کنار هم.</p>
</body></html>`;

const TILES = [
  { file: 'promo-small.png', width: 440, height: 280, pad: 34, markSize: 40, name: 32, tagline: 30, line: 15, sun: { left: -70, size: 260 } },
  { file: 'promo-marquee.png', width: 1400, height: 560, pad: 110, markSize: 92, name: 74, tagline: 76, line: 32, sun: { left: -120, size: 560 } },
];

for (const spec of TILES) {
  const canvas = await browser.newPage({ viewport: { width: spec.width, height: spec.height }, deviceScaleFactor: 1 });
  await canvas.setContent(tile(spec), { waitUntil: 'load' });
  await canvas.evaluate(() => document.fonts.ready);
  await canvas.screenshot({ path: join(store, spec.file) });
  await canvas.close();
}

// The 128x128 the listing asks for, beside the rest so every graphic the form
// wants is in one folder. Flattened onto the same cream the icon is drawn on:
// the mark is opaque anyway, and the store's other slots reject alpha, so one
// consistent 24-bit RGB folder is easier to reason about than a mixed one.
const icon = await browser.newPage({ viewport: { width: 128, height: 128 }, deviceScaleFactor: 1 });
await icon.setContent(`<body style="margin:0;background:${PAPER}"><img src="data:image/png;base64,${readFileSync(join(root, 'public/icon-128.png')).toString('base64')}" width="128" height="128"></body>`);
await icon.screenshot({ path: join(store, 'store-icon-128.png') });
await icon.close();

await browser.close();
await new Promise((done) => server.close(done));

console.log('\nupload');
for (const item of packages) console.log(`        extension/${item.name.padEnd(32)} ${(item.bytes / 1024).toFixed(0)} KB`);
console.log(`        addons-linter: 0 errors, ${lint.summary.warnings} warning(s)`);
console.log('\nlisting extension/store/');
for (const [label, file] of [['icon 128x128 — both', 'store-icon-128.png'], ['screenshot 1280x800 — both', 'newtab-light.png'], ['screenshot 1280x800 — both', 'newtab-dark.png'], ['small tile 440x280 — Chrome', 'promo-small.png'], ['marquee 1400x560 — Chrome', 'promo-marquee.png']]) {
  console.log(`        ${file.padEnd(22)} ${label}`);
}
