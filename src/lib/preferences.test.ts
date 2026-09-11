// ============================================================================
// Source: src/lib/preferences.test.ts
// Version: 0.5.0 — 2026-09-11
// Why: Guards preference validation, the attribute mapping, and that every
//      accent has its three CSS blocks.
// Env / Deps: Vitest; a minimal fake element stands in for <html>.
// ============================================================================

import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { MOTIF_DRAWINGS } from "../components/hero-motifs";
import { ACCENTS, DEFAULT_PREFERENCES, MOTIFS, FONTS, PREFERENCES_BOOT_SCRIPT, PREFERENCE_KEYS, applyPreferences, parsePreferences } from "./preferences";

const store = (values: Record<string, string>) => (key: string) => values[key] ?? null;

describe("preferences", () => {
  it("falls back to defaults for missing or unknown values", () => {
    expect(parsePreferences(() => null)).toEqual(DEFAULT_PREFERENCES);
    expect(parsePreferences(store({ [PREFERENCE_KEYS.theme]: "neon", [PREFERENCE_KEYS.accent]: "peach", [PREFERENCE_KEYS.size]: "xl", [PREFERENCE_KEYS.font]: "comic" }))).toEqual(DEFAULT_PREFERENCES);
  });

  it("accepts every listed option", () => {
    expect(parsePreferences(store({ [PREFERENCE_KEYS.theme]: "dark", [PREFERENCE_KEYS.accent]: "lapis", [PREFERENCE_KEYS.motif]: "cypress", [PREFERENCE_KEYS.size]: "lg", [PREFERENCE_KEYS.font]: "sahel" }))).toEqual({ theme: "dark", accent: "lapis", motif: "cypress", size: "lg", font: "sahel" });
  });

  it("maps preferences to html attributes and drops the theme and accent attributes for their defaults", () => {
    const attrs = new Map<string, string>();
    const root = { setAttribute: (k: string, v: string) => attrs.set(k, v), removeAttribute: (k: string) => attrs.delete(k) } as unknown as HTMLElement;
    applyPreferences(root, { theme: "dark", accent: "pink", motif: "rosette", size: "sm", font: "shabnam" });
    expect(Object.fromEntries(attrs)).toEqual({ "data-theme": "dark", "data-accent": "pink", "data-motif": "rosette", "data-size": "sm", "data-font": "shabnam" });
    applyPreferences(root, DEFAULT_PREFERENCES);
    expect(attrs.has("data-theme")).toBe(false);
    expect(attrs.has("data-accent")).toBe(false);
    expect(attrs.has("data-motif")).toBe(false);
    expect(attrs.get("data-size")).toBe("md");
  });

  // An accent missing a block renders in green in that mode, silently.
  it("gives every non-default accent a light, a dark and an OS-dark block, and names it in the boot script", () => {
    const css = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");
    for (const accent of ACCENTS) {
      if (accent.value === DEFAULT_PREFERENCES.accent) continue;
      expect(css).toContain(`html[data-accent="${accent.value}"] {`);
      expect(css).toContain(`html[data-accent="${accent.value}"][data-theme="dark"] {`);
      expect(css).toContain(`html[data-accent="${accent.value}"]:not([data-theme="light"]) {`);
      expect(PREFERENCES_BOOT_SCRIPT).toContain(`"${accent.value}"`);
    }
  });

  // A motif with no drawing or no CSS line would be offered in the menu and show nothing.
  it("gives every motif a drawing and a CSS line, and names the non-default ones in the boot script", () => {
    const css = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");
    for (const motif of MOTIFS) {
      expect(MOTIF_DRAWINGS[motif.value]).toBeTypeOf("function");
      expect(css).toContain(`[data-motif-art="${motif.value}"]`);
      if (motif.value !== DEFAULT_PREFERENCES.motif) {
        expect(css).toContain(`html[data-motif="${motif.value}"] [data-motif-art="${motif.value}"]`);
        expect(PREFERENCES_BOOT_SCRIPT).toContain(`"${motif.value}"`);
      }
    }
    expect(Object.keys(MOTIF_DRAWINGS).sort()).toEqual(MOTIFS.map((motif) => motif.value).sort());
  });

  // The boot script is hand-written JS; make sure it references the real keys and stays guarded
  it("boot script uses the storage keys and swallows storage errors", () => {
    for (const key of Object.values(PREFERENCE_KEYS)) expect(PREFERENCES_BOOT_SCRIPT).toContain(key);
    expect(PREFERENCES_BOOT_SCRIPT).toMatch(/try\{.*\}catch\(e\)\{\}/);
  });
});

describe('fonts', () => {
  it('offers five faces with unique values and Persian labels', () => {
    expect(FONTS).toHaveLength(5);
    expect(new Set(FONTS.map((font) => font.value)).size).toBe(FONTS.length);
    for (const font of FONTS) expect(font.label.trim().length).toBeGreaterThan(1);
  });

  it('accepts every offered font, including the two added last', () => {
    for (const font of FONTS) {
      expect(parsePreferences(store({ [PREFERENCE_KEYS.font]: font.value })).font).toBe(font.value);
    }
  });

  // The boot script used to name each non-default font by hand, so a new one
  // was not applied until hydration and the page flashed the wrong face.
  it('names every non-default font in the pre-paint boot script', () => {
    for (const font of FONTS) {
      if (font.value === DEFAULT_PREFERENCES.font) continue;
      expect(PREFERENCES_BOOT_SCRIPT).toContain(`"${font.value}"`);
    }
  });
});
