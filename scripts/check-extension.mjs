// ============================================================================
// Source: scripts/check-extension.mjs
// Version: 0.9.8 — 2026-09-08
// Why: The extension's whole pitch is "no permissions, no network, nothing
//      leaves the machine". A manifest and a bundle can quietly stop being
//      that, so every build is checked: the manifest asks for nothing, the
//      page loads only its own files, the code makes no request, and every
//      URL the stylesheet mentions exists on disk.
// Env / Deps: Runs after `vite build` as part of `npm run build:extension`.
//      Exits 1 with a list of failures; prints OK otherwise.
// ============================================================================

import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const dist = resolve(dirname(fileURLToPath(import.meta.url)), '../extension/dist');
const failures = [];
const fail = (message) => failures.push(message);
const read = (file) => readFileSync(join(dist, file), 'utf8');

// --- manifest ---------------------------------------------------------------
const manifest = JSON.parse(read('manifest.json'));
if (manifest.manifest_version !== 3) fail('manifest_version is not 3');
if (manifest.chrome_url_overrides?.newtab !== 'newtab.html') fail('newtab override missing');
if ((manifest.permissions ?? []).length) fail(`permissions requested: ${manifest.permissions.join(', ')}`);
if ((manifest.host_permissions ?? []).length) fail(`host_permissions requested: ${manifest.host_permissions.join(', ')}`);
if (manifest.content_security_policy) fail('a custom CSP is set; the MV3 default is the point');
for (const icon of Object.values(manifest.icons ?? {})) if (!existsSync(join(dist, icon))) fail(`icon missing: ${icon}`);
if (!/^\d+(\.\d+){1,3}$/.test(manifest.version)) fail(`version is not dotted numeric: ${manifest.version}`);

// --- html: every script and stylesheet is local -----------------------------
const html = read('newtab.html');
for (const [, url] of html.matchAll(/(?:src|href)="([^"]+)"/g)) {
  if (/^(https?:)?\/\//.test(url)) fail(`external reference in newtab.html: ${url}`);
  else if (!existsSync(join(dist, url.replace(/^\.\//, '').split('?')[0]))) fail(`referenced file missing: ${url}`);
}
if (!html.includes('src="./boot.js"')) fail('boot.js (pre-paint theme script) is not linked');
if (/<script(?![^>]*\bsrc=)[^>]*>[^<]/.test(html)) fail('inline script found; MV3 CSP blocks it');

// --- assets -----------------------------------------------------------------
const assets = readdirSync(join(dist, 'assets'));
const js = assets.filter((name) => name.endsWith('.js'));
const css = assets.filter((name) => name.endsWith('.css'));
if (js.length !== 1) fail(`expected one JS bundle, found ${js.length}`);
if (css.length !== 1) fail(`expected one CSS bundle, found ${css.length}`);

// Only woff2 ships: Chrome never needs the eot/ttf/woff copies the font
// packages carry, and they were 3 MB of a 3.6 MB package.
for (const name of assets) if (/\.(eot|ttf|woff)$/.test(name)) fail(`legacy font shipped: ${name}`);

// --- code: no request of any kind ------------------------------------------
const code = js.map((name) => read(join('assets', name))).join('\n');
for (const token of ['fetch(', 'XMLHttpRequest', 'sendBeacon', 'WebSocket(', 'EventSource(', 'importScripts(', 'eval(', 'new Function(']) {
  if (code.includes(token)) fail(`bundle contains ${token}`);
}
// URL strings are allowed only as XML namespaces, React's error-page prefix,
// and the one link a person can click. Anything else is a request waiting.
const allowed = [/^http:\/\/www\.w3\.org\//, /^https:\/\/react\.dev\/errors\//, /^https:\/\/taghv\.im$/];
for (const [url] of code.matchAll(/https?:\/\/[^\s"'`)\\<>]+/g)) {
  if (!allowed.some((pattern) => pattern.test(url))) fail(`unexpected URL in bundle: ${url}`);
}

// --- stylesheet: no external url(), and every local url() exists -----------
for (const name of css) {
  const sheet = read(join('assets', name));
  for (const [, url] of sheet.matchAll(/url\(\s*["']?([^"')]+)["']?\s*\)/g)) {
    if (/^(https?:)?\/\//.test(url) || url.startsWith('data:')) { if (!url.startsWith('data:')) fail(`external url() in css: ${url}`); continue; }
    const file = url.replace(/^\.\//, '').split(/[?#]/)[0];
    if (!existsSync(join(dist, 'assets', file))) fail(`css references a missing file: ${url}`);
  }
}

// --- boot.js is the site's script, byte for byte ----------------------------
const boot = read('boot.js');
if (!boot.includes('taghvim-theme') || !boot.includes('data-font')) fail('boot.js does not look like the preferences boot script');

if (failures.length) {
  console.error(`FAIL  extension check: ${failures.length} problem(s)`);
  for (const message of failures) console.error(`      - ${message}`);
  process.exit(1);
}
const bytes = readdirSync(join(dist, 'assets')).reduce((sum, name) => sum + readFileSync(join(dist, 'assets', name)).length, 0);
console.log(`OK    extension: no permissions, no network, ${assets.length} assets, ${(bytes / 1024).toFixed(0)} KB`);
