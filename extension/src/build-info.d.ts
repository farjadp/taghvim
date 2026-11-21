// ============================================================================
// Source: extension/src/build-info.d.ts
// Version: 0.2.0 — 2026-11-20
// Why: The two values vite.config stamps into the bundle, so the new tab can
//      name its own build. Declared, never assigned at runtime.
// Env / Deps: Replaced at build time by Vite's `define`; nothing reads them
//      outside the extension bundle.
// ============================================================================

declare const __EXT_VERSION__: string;
declare const __EXT_BUILT__: string;
// true only in the Capacitor app build (TARGET=app); false in the Chrome and Firefox packages.
declare const __APP_TARGET__: boolean;
