// ============================================================================
// Source: src/components/world-clocks.tsx
// Version: 0.8.0 — 2026-09-07
// Why: The second-clock block. Shows the visitor's own time when their zone
//      differs from Tehran, plus up to two cities they add. Renders nothing
//      but a small add link when there is nothing to show, so a visitor in
//      Iran sees the page unchanged. Styled for the dark hero, which is the
//      only place it is used; the picker itself is a light popover.
// Env / Deps: lib/clocks. Persists the chosen ids as `taghvim-clocks`.
//      The Tehran clock in the hero is untouched and remains the main clock.
// ============================================================================

"use client";

import { useEffect, useRef, useState } from "react";
import { Plus, X } from "lucide-react";
import { MAX_CLOCKS, ZONES, dayShift, deviceZone, matchesTehran, offsetFromTehran, parseClocks, timeIn, zoneLabel } from "@/lib/clocks";

const CLOCKS_KEY = "taghvim-clocks";

export function WorldClocks({ now }: { now: Date }) {
  // Both of these are unknown during server rendering, so they arrive on mount.
  // Until then nothing extra is drawn, which keeps the markup identical.
  const [device, setDevice] = useState<string | null>(null);
  const [picked, setPicked] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const menu = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setDevice(deviceZone());
    try { setPicked(parseClocks(localStorage.getItem(CLOCKS_KEY))); } catch { /* restricted storage */ }
  }, []);

  useEffect(() => {
    if (!open) return;
    function onPointer(event: PointerEvent) { if (!menu.current?.contains(event.target as Node)) setOpen(false); }
    function onKey(event: KeyboardEvent) { if (event.key === "Escape") setOpen(false); }
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("pointerdown", onPointer); document.removeEventListener("keydown", onKey); };
  }, [open]);

  function save(next: string[]) {
    setPicked(next);
    try { localStorage.setItem(CLOCKS_KEY, next.join(",")); } catch { /* not persisted; lives until reload */ }
  }

  // The visitor's own zone is added automatically, and only when it actually
  // differs from Tehran. A city that duplicates it is not listed twice.
  const showDevice = device !== null && !matchesTehran(now, device);
  const rows = [
    ...(showDevice ? [{ id: "__device", label: `${zoneLabel(device!)} (شما)`, timeZone: device!, removable: false }] : []),
    ...ZONES.filter((zone) => picked.includes(zone.id) && zone.timeZone !== device)
      .map((zone) => ({ id: zone.id, label: zone.city, timeZone: zone.timeZone, removable: true })),
  ];
  const rest = ZONES.filter((zone) => !picked.includes(zone.id) && zone.timeZone !== device);
  const canAdd = picked.length < MAX_CLOCKS && rest.length > 0;

  // The picker sits on the heading row rather than a line of its own, so the
  // block costs one row per clock and nothing else. It opens rightward from
  // the button: anchored to the other edge it would hang outside the hero and
  // paint underneath the card next to it.
  const addButton = canAdd && (
    <div ref={menu} className="relative">
      <button type="button" onClick={() => setOpen(!open)} aria-expanded={open} aria-label={rows.length ? "افزودن شهر" : "افزودن ساعت شهر دیگر"} className="flex items-center gap-1 text-[0.6875rem] font-medium text-forest hover:underline">
        <Plus size={13} />{rows.length ? "شهر" : "افزودن ساعت شهر دیگر"}
      </button>
      {open && (
        <div className="absolute left-0 top-6 z-20 flex w-56 flex-wrap gap-1.5 rounded-xl border border-line bg-surface p-3 shadow-lg">
          {rest.map((zone) => (
            <button key={zone.id} type="button" onClick={() => { save([...picked, zone.id]); setOpen(false); }} className="rounded-lg bg-paper px-2.5 py-1 text-[0.6875rem] text-ink hover:bg-leaf">{zone.city}</button>
          ))}
        </div>
      )}
    </div>
  );

  // Nothing to show and nothing to add: draw nothing at all.
  if (!rows.length && !canAdd) return null;

  // Nothing to show yet: one quiet link, no heading, so the card keeps its size.
  if (!rows.length) return <div className="pt-4">{addButton}</div>;

  return (
    <div data-testid="world-clocks" className="border-t border-white/15 pt-4">
      <div className="flex items-center justify-between gap-3 text-xs text-[#d9e3cf]"><span>ساعت شهرهای دیگر</span>{addButton || <span dir="ltr">CLOCKS</span>}</div>
      {rows.map((row) => {
        const shift = dayShift(now, row.timeZone);
        return (
          <div key={row.id} className="mt-2.5 flex items-center justify-between gap-3">
            <span className="flex min-w-0 items-baseline gap-1.5">
              <span className="truncate text-xs text-[#d9e3cf]">{row.label}</span>
              <span className="shrink-0 text-[0.625rem] text-[#d9e3cf] opacity-80">{offsetFromTehran(now, row.timeZone)}</span>
            </span>
            <span className="flex shrink-0 items-center gap-2">
              {shift && <span className="rounded bg-white/10 px-1.5 py-0.5 text-[0.625rem] text-[#d9e3cf]">{shift}</span>}
              <time className="text-base font-medium tabular-nums text-white" dir="ltr">{timeIn(now, row.timeZone)}</time>
              {row.removable && <button type="button" aria-label={`حذف ${row.label}`} onClick={() => save(picked.filter((id) => id !== row.id))} className="text-[#d9e3cf] hover:text-white"><X size={13} /></button>}
            </span>
          </div>
        );
      })}
    </div>
  );
}
