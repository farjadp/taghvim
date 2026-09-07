// ============================================================================
// Source: src/lib/preferences.ts
// Version: 0.4.0 — 2026-09-07
// Why: Display preferences — theme, font size, font family — as validated
//      values, the localStorage keys that hold them, and the tiny boot script
//      that applies them before first paint so dark mode never flashes.
// Env / Deps: Applied as data-theme / data-size / data-font on <html>;
//      globals.css maps each attribute to tokens. Storage access is guarded.
// ============================================================================

export type Theme = "auto" | "light" | "dark";
export type FontSize = "sm" | "md" | "lg";
export type Font = "vazirmatn" | "shabnam" | "sahel";
export type Preferences = { theme: Theme; size: FontSize; font: Font };

// Option lists drive both the menu and validation; labels are what the visitor sees.
export const THEMES: { value: Theme; label: string }[] = [
  { value: "auto", label: "خودکار" },
  { value: "light", label: "روشن" },
  { value: "dark", label: "تیره" },
];
export const SIZES: { value: FontSize; label: string }[] = [
  { value: "sm", label: "کوچک" },
  { value: "md", label: "متوسط" },
  { value: "lg", label: "بزرگ" },
];
export const FONTS: { value: Font; label: string }[] = [
  { value: "vazirmatn", label: "وزیرمتن" },
  { value: "shabnam", label: "شبنم" },
  { value: "sahel", label: "ساحل" },
];

export const DEFAULT_PREFERENCES: Preferences = { theme: "auto", size: "md", font: "vazirmatn" };

// One localStorage key per preference, alongside taghvim-city and taghvim-scope.
export const PREFERENCE_KEYS = { theme: "taghvim-theme", size: "taghvim-size", font: "taghvim-font" } as const;

// Reads through an injectable getter (localStorage in the app, a map in tests).
// Unknown or missing values fall back to the default instead of throwing.
export function parsePreferences(read: (key: string) => string | null): Preferences {
  const pick = <T extends string>(options: { value: T }[], raw: string | null, fallback: T): T =>
    options.some((option) => option.value === raw) ? (raw as T) : fallback;
  return {
    theme: pick(THEMES, read(PREFERENCE_KEYS.theme), DEFAULT_PREFERENCES.theme),
    size: pick(SIZES, read(PREFERENCE_KEYS.size), DEFAULT_PREFERENCES.size),
    font: pick(FONTS, read(PREFERENCE_KEYS.font), DEFAULT_PREFERENCES.font),
  };
}

// Writes the attributes globals.css reacts to. "auto" theme means no attribute,
// so the prefers-color-scheme media query decides.
export function applyPreferences(root: HTMLElement, preferences: Preferences): void {
  if (preferences.theme === "auto") root.removeAttribute("data-theme");
  else root.setAttribute("data-theme", preferences.theme);
  root.setAttribute("data-size", preferences.size);
  root.setAttribute("data-font", preferences.font);
}

// Same logic as parse + apply, as a string, inlined in <head> so it runs before
// the first paint. Kept dependency-free and tolerant of blocked storage.
export const PREFERENCES_BOOT_SCRIPT = `(function(){try{var d=document.documentElement,g=function(k){return localStorage.getItem(k)};var t=g("${PREFERENCE_KEYS.theme}"),s=g("${PREFERENCE_KEYS.size}"),f=g("${PREFERENCE_KEYS.font}");if(t==="light"||t==="dark")d.setAttribute("data-theme",t);if(s==="sm"||s==="lg")d.setAttribute("data-size",s);if(f==="shabnam"||f==="sahel")d.setAttribute("data-font",f)}catch(e){}})();`;
