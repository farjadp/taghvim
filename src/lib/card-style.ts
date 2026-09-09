// ============================================================================
// Source: src/lib/card-style.ts
// Version: 0.1.0 — 2026-09-09
// Why: How the day card is dressed — the plain green it has always been, a set
//      of colour palettes, or one of the photographs in public/backgrounds.
//      Client-safe: no filesystem here, so it can be imported anywhere.
// Env / Deps: Persists `taghvim-card` in localStorage, guarded the way
//      lib/view.ts guards its record. Colours are hex because a canvas cannot
//      read a CSS variable; the card is an exported image, not themed UI.
// ============================================================================

export type CardColours = {
  background: string;
  // The date itself.
  primary: string;
  // Weekday, the other two calendars, the source line.
  secondary: string;
  // Occasion titles on an ordinary day.
  accent: string;
  // Occasion titles on a holiday.
  holiday: string;
  // The hairline under the date.
  rule: string;
};

export type Palette = { id: string; label: string; colours: CardColours };

// Light text on a dark ground, used by every dark palette and by every photo.
const ON_DARK = { primary: '#ffffff', secondary: '#d9e3cf', accent: '#e2eadb', holiday: '#e39a85', rule: 'rgba(255,255,255,0.18)' };
const ON_LIGHT = { primary: '#243e34', secondary: '#5c6a61', accent: '#214f40', holiday: '#a9503b', rule: '#e6eae3' };

// The first is what the card has always been and stays the default. Each colour is either a
// token from globals.css or a darker mix of one; keep them in that family.
export const PALETTES: Palette[] = [
  { id: 'forest', label: 'سبز', colours: { background: '#214f40', ...ON_DARK } },
  { id: 'night', label: 'شب', colours: { background: '#121a16', ...ON_DARK, accent: '#8cc7ad' } },
  { id: 'clay', label: 'خاک‌رس', colours: { background: '#8c4131', ...ON_DARK, secondary: '#f0d9d2', accent: '#f7e2da', holiday: '#ffd9cb' } },
  { id: 'paper', label: 'کاغذ', colours: { background: '#f7f8f4', ...ON_LIGHT } },
  { id: 'sand', label: 'شنی', colours: { background: '#f5eee1', ...ON_LIGHT, secondary: '#6b6152' } },
];

export const DEFAULT_PALETTE = PALETTES[0];

export const PHOTO_COLOURS: CardColours = { background: '#214f40', ...ON_DARK };

/** A photograph offered as a background. `src` is already URL-encoded. */
export type Background = { id: string; src: string };

// What the visitor picked. A photo id that no longer exists falls back to the palette, so
// deleting a file from the folder can never leave someone with a blank card.
export type CardStyle = { kind: 'palette'; id: string } | { kind: 'photo'; id: string };

export const CARD_STYLE_KEY = 'taghvim-card';
export const DEFAULT_CARD_STYLE: CardStyle = { kind: 'palette', id: DEFAULT_PALETTE.id };

type StorageGetter = () => Storage;

function isCardStyle(value: unknown): value is CardStyle {
  if (typeof value !== 'object' || value === null) return false;
  const record = value as Record<string, unknown>;
  return (record.kind === 'palette' || record.kind === 'photo') && typeof record.id === 'string' && record.id.length > 0;
}

export function readCardStyle(getStorage?: StorageGetter): CardStyle {
  try {
    const storage = getStorage ? getStorage() : window.localStorage;
    const raw = storage.getItem(CARD_STYLE_KEY);
    if (raw === null) return { ...DEFAULT_CARD_STYLE };
    const parsed: unknown = JSON.parse(raw);
    return isCardStyle(parsed) ? parsed : { ...DEFAULT_CARD_STYLE };
  } catch {
    return { ...DEFAULT_CARD_STYLE };
  }
}

export function saveCardStyle(style: CardStyle, getStorage?: StorageGetter): void {
  try {
    const storage = getStorage ? getStorage() : window.localStorage;
    storage.setItem(CARD_STYLE_KEY, JSON.stringify(style));
  } catch {
    // Keep the in-memory choice usable when persistence fails.
  }
}

/**
 * The colours and the photo to draw for a stored choice. A choice that no longer resolves —
 * a palette renamed, a photo deleted from the folder — quietly becomes the default rather
 * than an error or a blank card.
 */
export function resolveCardStyle(style: CardStyle, backgrounds: Background[]): { colours: CardColours; photo?: Background } {
  if (style.kind === 'photo') {
    const photo = backgrounds.find((item) => item.id === style.id);
    if (photo) return { colours: PHOTO_COLOURS, photo };
    return { colours: DEFAULT_PALETTE.colours };
  }
  const palette = PALETTES.find((item) => item.id === style.id) ?? DEFAULT_PALETTE;
  return { colours: palette.colours };
}
