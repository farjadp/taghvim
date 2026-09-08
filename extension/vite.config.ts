// ============================================================================
// Source: extension/vite.config.ts
// Version: 0.9.8 — 2026-09-08
// Why: Builds the Chrome extension from the same source the site uses.
//      `@/` resolves into ../src so panels and lib are imported, never copied.
//      A small plugin emits what Vite would not otherwise produce: the
//      manifest, the icons, and boot.js — the pre-paint theme script, which
//      MV3's CSP forbids inline and which must be a classic (non-module)
//      script so it runs before the first paint.
// Env / Deps: vite, @vitejs/plugin-react, @tailwindcss/vite. Output in
//      extension/dist; `npm run build:extension` runs this then the checks.
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
      this.emitFile({ type: "asset", fileName: "manifest.json", source: readFileSync(resolve(here, "manifest.json")) });
      this.emitFile({ type: "asset", fileName: "icon.svg", source: readFileSync(resolve(repo, "src/app/icon.svg")) });
      // Every size the manifest names, read from the manifest so the two
      // cannot disagree — a missing icon fails the check script, not Chrome.
      const manifest = JSON.parse(readFileSync(resolve(here, "manifest.json"), "utf8")) as { icons: Record<string, string> };
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
    outDir: resolve(here, "dist"),
    emptyOutDir: true,
    rollupOptions: { input: resolve(here, "newtab.html") },
    // Chrome supports <link rel="modulepreload"> natively. The polyfill Vite
    // would add is the only `fetch(` in the whole bundle, and the check script
    // treats any fetch as a failure — so it is not built in.
    modulePreload: { polyfill: false },
    // One CSS file, one JS file: easier to inspect in the check script and
    // nothing to gain from splitting a page that loads once per tab.
    cssCodeSplit: false,
  },
});
