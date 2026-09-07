// ============================================================================
// Source: src/lib/preferences.test.ts
// Version: 0.4.0 — 2026-09-07
// Why: Guards preference validation and the attribute mapping.
// Env / Deps: Vitest; a minimal fake element stands in for <html>.
// ============================================================================

import { describe, expect, it } from "vitest";
import { DEFAULT_PREFERENCES, PREFERENCES_BOOT_SCRIPT, PREFERENCE_KEYS, applyPreferences, parsePreferences } from "./preferences";

const store = (values: Record<string, string>) => (key: string) => values[key] ?? null;

describe("preferences", () => {
  it("falls back to defaults for missing or unknown values", () => {
    expect(parsePreferences(() => null)).toEqual(DEFAULT_PREFERENCES);
    expect(parsePreferences(store({ [PREFERENCE_KEYS.theme]: "neon", [PREFERENCE_KEYS.size]: "xl", [PREFERENCE_KEYS.font]: "comic" }))).toEqual(DEFAULT_PREFERENCES);
  });

  it("accepts every listed option", () => {
    expect(parsePreferences(store({ [PREFERENCE_KEYS.theme]: "dark", [PREFERENCE_KEYS.size]: "lg", [PREFERENCE_KEYS.font]: "sahel" }))).toEqual({ theme: "dark", size: "lg", font: "sahel" });
  });

  it("maps preferences to html attributes and drops the theme attribute for auto", () => {
    const attrs = new Map<string, string>();
    const root = { setAttribute: (k: string, v: string) => attrs.set(k, v), removeAttribute: (k: string) => attrs.delete(k) } as unknown as HTMLElement;
    applyPreferences(root, { theme: "dark", size: "sm", font: "shabnam" });
    expect(Object.fromEntries(attrs)).toEqual({ "data-theme": "dark", "data-size": "sm", "data-font": "shabnam" });
    applyPreferences(root, DEFAULT_PREFERENCES);
    expect(attrs.has("data-theme")).toBe(false);
    expect(attrs.get("data-size")).toBe("md");
  });

  // The boot script is hand-written JS; make sure it references the real keys and stays guarded
  it("boot script uses the storage keys and swallows storage errors", () => {
    for (const key of Object.values(PREFERENCE_KEYS)) expect(PREFERENCES_BOOT_SCRIPT).toContain(key);
    expect(PREFERENCES_BOOT_SCRIPT).toMatch(/try\{.*\}catch\(e\)\{\}/);
  });
});
