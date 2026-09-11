// ============================================================================
// Source: extension/src/build-info.d.ts
// Version: 0.1.0 — 2026-09-10
// Why: The two values vite.config stamps into the bundle, so the new tab can
//      name its own build. Declared, never assigned at runtime.
// Env / Deps: Replaced at build time by Vite's `define`; nothing reads them
//      outside the extension bundle.
// ============================================================================

declare const __EXT_VERSION__: string;
declare const __EXT_BUILT__: string;
