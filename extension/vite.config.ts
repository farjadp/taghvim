// ============================================================================
// Source: extension/vite.config.ts
// Version: 0.9.15 — 2026-09-09
// Why: Builds the browser extension from the same source the site uses.
//      `@/` resolves into ../src so panels and lib are imported, never copied.
//      A small plugin emits what Vite would not otherwise produce: the
//      manifest, the icons, and boot.js — the pre-paint theme script, which
//      MV3's CSP forbids inline and which must be a classic (non-module)
//      script so it runs before the first paint.
//      One config, two targets: the bundle is identical in Chrome and Firefox
//      (no background page, no permissions, no browser API is called), so the
//      only thing that differs is the manifest, and Firefox's differences are
//      kept as a delta file rather than a second full copy that can drift.
// Env / Deps: vite, @vitejs/plugin-react, @tailwindcss/vite. `TARGET=firefox`
//      selects the Gecko build; output in extension/dist or extension/
//      dist-firefox. `npm run build:extension` runs this then the checks.
// ============================================================================

import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig, type Plugin } from "vite";
import { PREFERENCES_BOOT_SCRIPT } from "../src/lib/preferences";

const here = dirname(fileURLToPath(import.meta.url));
const repo = resolve(here, "..");

// Chrome is the default so an unset environment builds what it always built.
const TARGET = process.env.TARGET === "firefox" ? "firefox" : "chrome";
const outDir = resolve(here, TARGET === "firefox" ? "dist-firefox" : "dist");

// manifest.json is the Chrome manifest and the base for both. The Firefox file
// holds only what differs, and a `null` there deletes the key outright — that
// is how `offline_enabled` (a Chrome-apps leftover that makes AMO's linter
// complain) disappears without a second hand-maintained manifest.
function manifestFor(target: "chrome" | "firefox"): Record<string, unknown> {
  const base = JSON.parse(readFileSync(resolve(here, "manifest.json"), "utf8")) as Record<string, unknown>;
  if (target === "chrome") return base;
  const delta = JSON.parse(readFileSync(resolve(here, "manifest.firefox.json"), "utf8")) as Record<string, unknown>;
  for (const [key, value] of Object.entries(delta)) {
    if (value === null) delete base[key];
    else base[key] = value;
  }
  return base;
}

// Chrome has read woff2 since 2014. The Shabnam and Sahel packages also ship
// eot, ttf and woff for browsers this extension can never run in, and Vite
// copies every file a stylesheet mentions — 3 MB of dead weight in a 3.6 MB
// package. Drop them and rewrite the `src` lists so nothing dangles.
const LEGACY_FONT = /\.(eot|ttf|woff)(\?[^)]*)?$/;

function keepOnlyWoff2(css: string): string {
  return css.replace(/src:([^;}]*);?/g, (_match, list: string) => {
    const kept = list.split(",").map((entry) => entry.trim()).filter((entry) => /\.woff2\)/.test(entry));
    // An `src` left with nothing (the IE `.eot` line) is removed outright.
    return kept.length ? `src:${kept.join(",")};` : "";
  });
}

// Files the extension needs that are not reachable from newtab.html's imports.
function extensionAssets(): Plugin {
  return {
    name: "taghvim-extension-assets",
    // Vite's own CSS plugin adds the stylesheet to the bundle in its post
    // stage; run after it, or the font rewrite sees no stylesheet to rewrite.
    enforce: "post",
    transformIndexHtml() {
      // A classic script anywhere in <head> runs before the body paints; "head"
      // (append) keeps <meta charset> as the first thing in the document.
      return [{ tag: "script", attrs: { src: "./boot.js" }, injectTo: "head" }];
    },
    generateBundle: { order: "post", handler(_options, bundle) {
      for (const [fileName, item] of Object.entries(bundle)) {
        if (item.type !== "asset") continue;
        if (LEGACY_FONT.test(fileName)) delete bundle[fileName];
        // Without `enforce: "post"` above, the stylesheet was not in the bundle
        // yet and this loop rewrote nothing — the check script caught 35
        // dangling url()s. The decode is defensive: asset sources may be bytes.
        if (fileName.endsWith(".css")) {
          const source = typeof item.source === "string" ? item.source : new TextDecoder().decode(item.source);
          item.source = keepOnlyWoff2(source);
        }
      }
      this.emitFile({ type: "asset", fileName: "boot.js", source: PREFERENCES_BOOT_SCRIPT });
      const manifest = manifestFor(TARGET) as { icons: Record<string, string> };
      this.emitFile({ type: "asset", fileName: "manifest.json", source: `${JSON.stringify(manifest, null, 2)}\n` });
      this.emitFile({ type: "asset", fileName: "icon.svg", source: readFileSync(resolve(repo, "src/app/icon.svg")) });
      // Every size the manifest names, read from the manifest so the two
      // cannot disagree — a missing icon fails the check script, not the browser.
      for (const file of new Set(Object.values(manifest.icons))) {
        this.emitFile({ type: "asset", fileName: file, source: readFileSync(resolve(repo, "public", file)) });
      }
    } },
  };
}

export default defineConfig({
  root: here,
  // Relative URLs: chrome-extension:// pages resolve them against the document.
  base: "./",
  publicDir: false,
  plugins: [react(), tailwindcss(), extensionAssets()],
  resolve: { alias: { "@": resolve(repo, "src") } },
  build: {
    outDir,
    emptyOutDir: true,
    rollupOptions: { input: resolve(here, "newtab.html") },
    // Chrome and Firefox both support <link rel="modulepreload"> natively. The
    // polyfill Vite would add is the only `fetch(` in the whole bundle, and the
    // check script treats any fetch as a failure — so it is not built in.
    modulePreload: { polyfill: false },
    // One CSS file, one JS file: easier to inspect in the check script and
    // nothing to gain from splitting a page that loads once per tab.
    cssCodeSplit: false,
  },
});
