// ============================================================================
// Source: src/components/settings-menu.tsx
// Version: 0.9.24 — 2026-09-10
// Why: Gear button + popover for theme, font size, font family, and the day
//      card's background. Applies the choice immediately and remembers it.
// Env / Deps: lib/preferences and lib/card-style. Lives in both headers, and in
//      the extension's — so NO next/* imports here, ever. The card section only
//      appears where a `card` prop is passed: secondary pages draw no card and
//      the extension ships no photographs.
// ============================================================================

"use client";

import { useEffect, useRef, useState } from "react";
import { Settings2 } from "lucide-react";
import { DEFAULT_PREFERENCES, FONTS, PREFERENCE_KEYS, SIZES, THEMES, applyPreferences, parsePreferences, type Preferences } from "@/lib/preferences";
import { fa } from "@/lib/calendar";
import { PALETTES, type Background, type CardStyle } from "@/lib/card-style";

// Nothing to choose between when there is one palette and no photographs.
function backgroundsOrPalettes(card: { backgrounds: Background[] }): boolean {
  return PALETTES.length > 1 || card.backgrounds.length > 0;
}

// One row of the menu: a label and a segmented control. `stacked` puts the label
// on its own line and lets the control use the panel's full width — the five font
// names do not fit beside their label, and used to paint outside the card.
// Both shapes wrap rather than overflow, so a sixth option can never escape again.
function Choice<T extends string>({ label, options, value, onChange, stacked }: { label: string; options: { value: T; label: string }[]; value: T; onChange: (value: T) => void; stacked?: boolean }) {
  const control = <div className={`flex min-w-0 flex-wrap rounded-lg bg-paper p-0.5 ${stacked ? "gap-0.5" : ""}`}>{options.map((option) => <button key={option.value} type="button" aria-pressed={value === option.value} onClick={() => onChange(option.value)} className={`shrink-0 rounded-md px-2.5 py-1 text-[0.6875rem] transition-colors ${value === option.value ? "bg-surface font-medium text-forest shadow-sm" : "text-muted hover:text-ink"}`}>{option.label}</button>)}</div>;
  if (stacked) return <div role="group" aria-label={label} className="space-y-1.5">
    <span className="block text-xs text-muted">{label}</span>
    {control}
  </div>;
  return <div role="group" aria-label={label} className="flex items-center justify-between gap-4">
    <span className="shrink-0 text-xs text-muted">{label}</span>
    {control}
  </div>;
}

// The swatches for the day card. Palettes are their own colour; a photograph shows itself,
// unblurred, because a blurred thumbnail at this size is a grey square and tells you nothing.
function CardChoice({ style, backgrounds, onChange }: { style: CardStyle; backgrounds: Background[]; onChange: (next: CardStyle) => void }) {
  const swatch = (selected: boolean) =>
    `size-9 overflow-hidden rounded-lg border transition-colors ${selected ? "border-forest ring-2 ring-forest/40" : "border-line hover:border-forest/50"}`;
  return (
    <div role="group" aria-label="پس‌زمینهٔ تصویر روز" className="space-y-2">
      <span className="block text-xs text-muted">پس‌زمینهٔ تصویر روز</span>
      <div className="grid max-h-40 grid-cols-6 gap-1.5 overflow-y-auto">
        {PALETTES.map((palette) => (
          <button key={palette.id} type="button" title={palette.label} aria-label={palette.label}
            aria-pressed={style.kind === "palette" && style.id === palette.id}
            onClick={() => onChange({ kind: "palette", id: palette.id })}
            className={swatch(style.kind === "palette" && style.id === palette.id)}
            style={{ backgroundColor: palette.colours.background }} />
        ))}
        {backgrounds.map((photo, index) => (
          <button key={photo.id} type="button" title={`عکس ${fa(index + 1)}`} aria-label={`عکس ${fa(index + 1)}`}
            aria-pressed={style.kind === "photo" && style.id === photo.id}
            onClick={() => onChange({ kind: "photo", id: photo.id })}
            className={swatch(style.kind === "photo" && style.id === photo.id)}>
            {/* Plain <img>: this component is bundled into the extension, which must not
                carry a next/* import. */}
            <img src={photo.src} alt="" loading="lazy" className="size-full object-cover" />
          </button>
        ))}
      </div>
    </div>
  );
}

export function SettingsMenu({ card }: { card?: { style: CardStyle; backgrounds: Background[]; onChange: (next: CardStyle) => void } } = {}) {
  const [open, setOpen] = useState(false);
  const [prefs, setPrefs] = useState<Preferences>(DEFAULT_PREFERENCES);
  const [storageError, setStorageError] = useState(false);
  const menu = useRef<HTMLDivElement>(null);
  // The boot script already applied stored values; this only syncs the control state
  useEffect(() => {
    try { setPrefs(parsePreferences((key) => localStorage.getItem(key))); } catch { setStorageError(true); }
  }, []);
  // Close on outside click or Escape while open
  useEffect(() => {
    if (!open) return;
    function onPointer(event: PointerEvent) { if (!menu.current?.contains(event.target as Node)) setOpen(false); }
    function onKey(event: KeyboardEvent) { if (event.key === "Escape") setOpen(false); }
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("pointerdown", onPointer); document.removeEventListener("keydown", onKey); };
  }, [open]);
  function update<K extends keyof Preferences>(key: K, value: Preferences[K]) {
    const next = { ...prefs, [key]: value };
    setPrefs(next);
    applyPreferences(document.documentElement, next);
    try { localStorage.setItem(PREFERENCE_KEYS[key], value); setStorageError(false); } catch { setStorageError(true); }
  }
  return <div ref={menu} className="relative">
    <button type="button" aria-label="تنظیمات نمایش" aria-expanded={open} aria-controls="display-settings" onClick={() => setOpen((value) => !value)} className={`icon-button size-9 ${open ? "bg-leaf text-forest" : ""}`}><Settings2 size={17} /></button>
    {/* Phones pin the panel to the viewport so a large root font cannot push it off-screen */}
    {open && <div id="display-settings" className="z-40 space-y-3 rounded-2xl border border-line bg-surface p-4 shadow-lg max-sm:fixed max-sm:inset-x-4 max-sm:top-20 sm:absolute sm:left-0 sm:top-11 sm:w-72">
      <Choice label="پوسته" options={THEMES} value={prefs.theme} onChange={(value) => update("theme", value)} />
      <Choice label="اندازهٔ قلم" options={SIZES} value={prefs.size} onChange={(value) => update("size", value)} />
      <Choice label="قلم" options={FONTS} value={prefs.font} onChange={(value) => update("font", value)} stacked />
      {card && backgroundsOrPalettes(card) && (
        <div className="border-t border-line pt-3">
          <CardChoice style={card.style} backgrounds={card.backgrounds} onChange={card.onChange} />
        </div>
      )}
      {storageError && <p role="status" className="text-[0.625rem] text-clay">ذخیرهٔ تنظیمات در مرورگر ممکن نیست؛ تا بستن صفحه حفظ می‌شود.</p>}
    </div>}
  </div>;
}
