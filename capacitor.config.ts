// ============================================================================
// Source: capacitor.config.ts
// Version: 0.1.0 — 2026-09-10
// Why: The Android (and later iPhone) app is the extension's offline bundle in a
//      native shell — the same calendar with no UI rewrite, and no network: the
//      page is served from the app's own files, so the manifest needs no
//      INTERNET permission. `im.taghv.app` is Farjad's pick of 10 Sep and is
//      permanent once on Google Play.
// Env / Deps: @capacitor/cli. `npm run build:app` writes mobile/web; the native
//      project lives in mobile/android/app beside the shared Kotlin core.
// ============================================================================

import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "im.taghv.app",
  appName: "تقویم",
  webDir: "mobile/web",
  // No backgroundColor here: it is one fixed colour. MainActivity sets the
  // WebView's background from res/values*/splash_colors.xml so night mode gets
  // dark paper. Left white, the emulator flashed a white frame before the page.
  android: { path: "mobile/android/app" },
  // Beside mobile/ios/TaghvimCore, the Swift package the widgets share.
  // contentInset: the first iPhone build drew the page under the status bar —
  // the clock and battery sat on the logo and the gear. «always» makes the
  // WebView keep clear of the safe area, so neither the site nor the Android
  // app changes.
  ios: { path: "mobile/ios/app", contentInset: "always" },
};

export default config;
