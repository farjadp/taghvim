// ============================================================================
// Source: src/lib/preferences.ts
// Version: 0.9.38 — 2026-09-11
// Why: Display preferences — theme, accent colour, hero motif, font size, font
//      family — as validated values, the localStorage keys that hold them, and the
//      tiny boot script that applies them before first paint so nothing flashes.
// Env / Deps: Applied as data-theme / data-accent / data-motif / data-size / data-font on
//      <html>; globals.css maps each attribute to tokens. Storage access is guarded.
// ============================================================================

export type Theme = "auto" | "light" | "dark";
// The accent is independent of the theme: every accent has a light and a dark set.
// Peach was tried in /sandbox/colors and dropped: 4° of hue from the holiday red.
export type Accent = "green" | "pink" | "turquoise" | "lapis";
// The hero's drawing; the drawings themselves live in components/hero-motifs.
export type Motif = "sun" | "merlons" | "rosette" | "pearls" | "cypress";
export type FontSize = "sm" | "md" | "lg";
export type Font = "vazirmatn" | "shabnam" | "sahel" | "iransans" | "iranyekan";
export type Preferences = { theme: Theme; accent: Accent; motif: Motif; size: FontSize; font: Font };

// Option lists drive both the menu and validation; labels are what the visitor sees.
export const THEMES: { value: Theme; label: string }[] = [
  { value: "auto", label: "خودکار" },
  { value: "light", label: "روشن" },
  { value: "dark", label: "تیره" },
];
// `swatch` is the light accent, shown as a dot beside each name in the menu.
export const ACCENTS: { value: Accent; label: string; swatch: string }[] = [
  { value: "green", label: "سبز", swatch: "#214f40" },
  { value: "pink", label: "صورتی", swatch: "#a3345f" },
  { value: "turquoise", label: "فیروزه‌ای", swatch: "#0f6b6e" },
  { value: "lapis", label: "لاجوردی", swatch: "#26418f" },
];
export const MOTIFS: { value: Motif; label: string }[] = [
  { value: "sun", label: "خورشید" },
  { value: "merlons", label: "کنگره" },
  { value: "rosette", label: "نیلوفر" },
  { value: "pearls", label: "مروارید" },
  { value: "cypress", label: "سرو" },
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
  { value: "iransans", label: "ایران‌سنس" },
  { value: "iranyekan", label: "ایران‌یکان" },
];

export const DEFAULT_PREFERENCES: Preferences = { theme: "auto", accent: "green", motif: "sun", size: "md", font: "vazirmatn" };

// One localStorage key per display preference, alongside city, view and clocks.
export const PREFERENCE_KEYS = { theme: "taghvim-theme", accent: "taghvim-accent", motif: "taghvim-motif", size: "taghvim-size", font: "taghvim-font" } as const;

// Reads through an injectable getter (localStorage in the app, a map in tests).
// Unknown or missing values fall back to the default instead of throwing.
export function parsePreferences(read: (key: string) => string | null): Preferences {
  const pick = <T extends string>(options: { value: T }[], raw: string | null, fallback: T): T =>
    options.some((option) => option.value === raw) ? (raw as T) : fallback;
  return {
    theme: pick(THEMES, read(PREFERENCE_KEYS.theme), DEFAULT_PREFERENCES.theme),
    accent: pick(ACCENTS, read(PREFERENCE_KEYS.accent), DEFAULT_PREFERENCES.accent),
    motif: pick(MOTIFS, read(PREFERENCE_KEYS.motif), DEFAULT_PREFERENCES.motif),
    size: pick(SIZES, read(PREFERENCE_KEYS.size), DEFAULT_PREFERENCES.size),
    font: pick(FONTS, read(PREFERENCE_KEYS.font), DEFAULT_PREFERENCES.font),
  };
}

// Writes the attributes globals.css reacts to. "auto" theme means no attribute,
// so the prefers-color-scheme media query decides; green, the default accent,
// is the base palette and also needs no attribute.
export function applyPreferences(root: HTMLElement, preferences: Preferences): void {
  if (preferences.theme === "auto") root.removeAttribute("data-theme");
  else root.setAttribute("data-theme", preferences.theme);
  if (preferences.accent === DEFAULT_PREFERENCES.accent) root.removeAttribute("data-accent");
  else root.setAttribute("data-accent", preferences.accent);
  if (preferences.motif === DEFAULT_PREFERENCES.motif) root.removeAttribute("data-motif");
  else root.setAttribute("data-motif", preferences.motif);
  root.setAttribute("data-size", preferences.size);
  root.setAttribute("data-font", preferences.font);
}

// Same logic as parse + apply, as a string, inlined in <head> so it runs before
// the first paint. Kept dependency-free and tolerant of blocked storage.
// The font list is interpolated from FONTS rather than written out again: the
// old version named each non-default font by hand, so adding one silently left
// it unapplied until after hydration.
export const PREFERENCES_BOOT_SCRIPT = `(function(){var FONT_VALUES=${JSON.stringify(FONTS.map((font) => font.value))},ACCENT_VALUES=${JSON.stringify(ACCENTS.map((accent) => accent.value))},MOTIF_VALUES=${JSON.stringify(MOTIFS.map((motif) => motif.value))};try{var d=document.documentElement,g=function(k){return localStorage.getItem(k)};var t=g("${PREFERENCE_KEYS.theme}"),a=g("${PREFERENCE_KEYS.accent}"),m=g("${PREFERENCE_KEYS.motif}"),s=g("${PREFERENCE_KEYS.size}"),f=g("${PREFERENCE_KEYS.font}");if(t==="light"||t==="dark")d.setAttribute("data-theme",t);if(a&&a!=="${DEFAULT_PREFERENCES.accent}"&&ACCENT_VALUES.indexOf(a)>-1)d.setAttribute("data-accent",a);if(m&&m!=="${DEFAULT_PREFERENCES.motif}"&&MOTIF_VALUES.indexOf(m)>-1)d.setAttribute("data-motif",m);if(s==="sm"||s==="lg")d.setAttribute("data-size",s);if(f&&f!=="vazirmatn"&&FONT_VALUES.indexOf(f)>-1)d.setAttribute("data-font",f)}catch(e){}})();`;
