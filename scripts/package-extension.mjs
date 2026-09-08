// ============================================================================
// Source: scripts/package-extension.mjs
// Version: 0.9.9 — 2026-09-08
// Why: Turns extension/dist into what the Chrome Web Store actually asks for:
//      one ZIP to upload, and 1280x800 screenshots for the listing. The
//      screenshots are rendered from the BUILT page in a real browser, so what
//      the listing shows is what the extension does, not a mockup.
// Env / Deps: Playwright's chromium and the `zip` binary. Runs the build first
//      so the ZIP can never be older than the source. The ZIP is git-ignored;
//      the screenshots are committed, since the listing should be reviewable.
// ============================================================================

import { execFileSync } from 'node:child_process';
import { createServer } from 'node:http';
import { existsSync, mkdirSync, readFileSync, rmSync } from 'node:fs';
import { dirname, extname, join, normalize, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'extension/dist');
const store = join(root, 'extension/store');
const version = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')).version;
const zipName = `taghvim-${version}.zip`;

execFileSync('npm', ['run', 'build:extension'], { cwd: root, stdio: 'inherit' });

// --- the upload ------------------------------------------------------------
// Zipped from inside dist so the archive has no wrapping folder: the store
// rejects a package whose manifest.json is not at the root.
rmSync(join(root, 'extension', zipName), { force: true });
execFileSync('zip', ['-r', '-q', '-X', join(root, 'extension', zipName), '.'], { cwd: dist });
const zipBytes = readFileSync(join(root, 'extension', zipName)).length;

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
await browser.close();
await new Promise((done) => server.close(done));

console.log(`\nupload  extension/${zipName} (${(zipBytes / 1024).toFixed(0)} KB)`);
console.log(`listing extension/store/newtab-light.png, newtab-dark.png (1280x800)`);
