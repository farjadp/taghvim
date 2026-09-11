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
  android: { path: "mobile/android/app" },
};

export default config;
