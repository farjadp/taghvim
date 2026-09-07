// ============================================================================
// Source: src/components/settings-menu.tsx
// Version: 0.4.0 — 2026-09-07
// Why: Gear button + popover for theme, font size and font family. Applies
//      the choice to <html> immediately and remembers it in localStorage.
// Env / Deps: lib/preferences for options and mapping. Lives in both headers.
// ============================================================================

"use client";

import { useEffect, useRef, useState } from "react";
import { Settings2 } from "lucide-react";
import { DEFAULT_PREFERENCES, FONTS, PREFERENCE_KEYS, SIZES, THEMES, applyPreferences, parsePreferences, type Preferences } from "@/lib/preferences";

// One row of the menu: a label and a segmented control
function Choice<T extends string>({ label, options, value, onChange }: { label: string; options: { value: T; label: string }[]; value: T; onChange: (value: T) => void }) {
  return <div role="group" aria-label={label} className="flex items-center justify-between gap-4">
    <span className="text-xs text-muted">{label}</span>
    <div className="flex rounded-lg bg-paper p-0.5">{options.map((option) => <button key={option.value} type="button" aria-pressed={value === option.value} onClick={() => onChange(option.value)} className={`rounded-md px-2.5 py-1 text-[0.6875rem] transition-colors ${value === option.value ? "bg-surface font-medium text-forest shadow-sm" : "text-muted hover:text-ink"}`}>{option.label}</button>)}</div>
  </div>;
}

export function SettingsMenu() {
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
      <Choice label="قلم" options={FONTS} value={prefs.font} onChange={(value) => update("font", value)} />
      {storageError && <p role="status" className="text-[0.625rem] text-clay">ذخیرهٔ تنظیمات در مرورگر ممکن نیست؛ تا بستن صفحه حفظ می‌شود.</p>}
    </div>}
  </div>;
}
