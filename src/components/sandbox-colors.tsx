// ============================================================================
// Source: src/components/sandbox-colors.tsx
// Version: 0.1.0 — 2026-09-11
// Why: SANDBOX. Five accent palettes (the current green plus pink, peach,
//      turquoise, lapis), each in light and dark, drawn with the app's real
//      token names and measured live: every card prints its own contrast ratios.
//      Delete with src/app/sandbox/colors once Farjad has picked.
// Env / Deps: Client component; reads computed colours to measure contrast.
//      The palette is set as CSS variables on each card, which is the only way
//      to scope a token set to one element — hence the style attribute.
// ============================================================================

"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";

type Tokens = { paper: string; surface: string; ink: string; muted: string; line: string; forest: string; deep: string; leaf: string; scrollbar: string };
type Accent = { id: string; label: string; light: Tokens; dark: Tokens };

// The two holiday tokens are shared by every accent; a palette that clashes with
// them shows up in the «فاصله از قرمز تعطیل» row rather than being hidden.
const HOLIDAY = { light: { holiday: "#fce8e3", clay: "#a9503b" }, dark: { holiday: "#3a2622", clay: "#e39a85" } };

export const ACCENTS: Accent[] = [
  { id: "green", label: "سبز (فعلی)",
    light: { paper: "#f7f8f4", surface: "#ffffff", ink: "#243e34", muted: "#5c6a61", line: "#e6eae3", forest: "#214f40", deep: "#214f40", leaf: "#eaf0e6", scrollbar: "#bcc8bb" },
    dark: { paper: "#121a16", surface: "#1a2420", ink: "#e6ece8", muted: "#9fb0a6", line: "#2c3a33", forest: "#8cc7ad", deep: "#1f4a3b", leaf: "#1f2e28", scrollbar: "#3a4a42" } },
  { id: "pink", label: "صورتی",
    light: { paper: "#fbf6f8", surface: "#ffffff", ink: "#4a2436", muted: "#735a66", line: "#efe3e8", forest: "#a3345f", deep: "#a3345f", leaf: "#f8e6ee", scrollbar: "#d9bfcb" },
    dark: { paper: "#1a1216", surface: "#241a1f", ink: "#f1e6ea", muted: "#b8a0ab", line: "#3a2a31", forest: "#f0a3c0", deep: "#6b2442", leaf: "#2e1f26", scrollbar: "#4a3640" } },
  { id: "peach", label: "گلبهی",
    light: { paper: "#fbf6f2", surface: "#ffffff", ink: "#4a2e24", muted: "#74604f", line: "#f0e4db", forest: "#a4502f", deep: "#a4502f", leaf: "#f9e9df", scrollbar: "#dcc5b6" },
    dark: { paper: "#1a1512", surface: "#241d19", ink: "#f1e8e3", muted: "#b8a699", line: "#3a2f28", forest: "#f2ab8f", deep: "#6e3322", leaf: "#2e241e", scrollbar: "#4a3b31" } },
  { id: "turquoise", label: "فیروزه‌ای",
    light: { paper: "#f3f8f8", surface: "#ffffff", ink: "#173d40", muted: "#56696a", line: "#dfeaea", forest: "#0f6b6e", deep: "#0f6b6e", leaf: "#dcefee", scrollbar: "#b3cfcf" },
    dark: { paper: "#0f1a1a", surface: "#152323", ink: "#e3eeee", muted: "#9bb3b3", line: "#26393a", forest: "#7fd0cf", deep: "#145456", leaf: "#1a2e2e", scrollbar: "#33494a" } },
  { id: "lapis", label: "لاجوردی",
    light: { paper: "#f5f6fa", surface: "#ffffff", ink: "#1f2a4a", muted: "#5a6278", line: "#e3e6ef", forest: "#26418f", deep: "#26418f", leaf: "#e5e9f6", scrollbar: "#bcc4dc" },
    dark: { paper: "#11141d", surface: "#181c28", ink: "#e6e9f2", muted: "#a0a7bd", line: "#2a3042", forest: "#9fb4ee", deep: "#2a3f7f", leaf: "#1e2436", scrollbar: "#394058" } },
];

function vars(tokens: Tokens, mode: "light" | "dark"): CSSProperties {
  return {
    "--color-paper": tokens.paper, "--color-surface": tokens.surface, "--color-ink": tokens.ink,
    "--color-muted": tokens.muted, "--color-line": tokens.line, "--color-forest": tokens.forest,
    "--color-forest-deep": tokens.deep, "--color-leaf": tokens.leaf, "--color-scrollbar": tokens.scrollbar,
    "--color-holiday": HOLIDAY[mode].holiday, "--color-clay": HOLIDAY[mode].clay,
  } as CSSProperties;
}

// WCAG relative luminance and contrast, from computed rgb() strings.
function rgb(value: string): [number, number, number] {
  const [r, g, b] = value.match(/[\d.]+/g)!.map(Number);
  return [r, g, b];
}
function luminance([r, g, b]: [number, number, number]): number {
  const lin = (c: number) => { const s = c / 255; return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4; };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}
function contrast(a: string, b: string): number {
  const [x, y] = [luminance(rgb(a)), luminance(rgb(b))].sort((m, n) => n - m);
  return (x + 0.05) / (y + 0.05);
}
// Hue distance in degrees: under ~25° the accent reads as the holiday red.
function hue([r, g, b]: [number, number, number]): number {
  const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
  if (d === 0) return 0;
  const h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return (h * 60 + 360) % 360;
}

type Row = { label: string; value: string; ok: boolean };

function Measurements({ target }: { target: React.RefObject<HTMLDivElement | null> }) {
  const [rows, setRows] = useState<Row[]>([]);
  useEffect(() => {
    const el = target.current;
    if (!el) return;
    const style = getComputedStyle(el);
    // Resolve each token to rgb() through a probe, since custom properties stay as written.
    const probe = document.createElement("span");
    el.appendChild(probe);
    const resolve = (name: string) => { probe.style.color = `var(${name})`; return getComputedStyle(probe).color; };
    const [paper, surface, ink, muted, forest, deep, clay, holiday] =
      ["--color-paper", "--color-surface", "--color-ink", "--color-muted", "--color-forest", "--color-forest-deep", "--color-clay", "--color-holiday"].map(resolve);
    probe.remove();
    void style;
    const ratio = (a: string, b: string, min: number, label: string): Row => { const r = contrast(a, b); return { label, value: `${r.toFixed(2)}:1`, ok: r >= min }; };
    const gap = Math.abs(((hue(rgb(forest)) - hue(rgb(clay)) + 540) % 360) - 180);
    setRows([
      ratio(ink, paper, 4.5, "متن روی زمینه"),
      ratio(muted, surface, 4.5, "متن کم‌رنگ روی کارت"),
      ratio(forest, surface, 4.5, "رنگ اصلی روی کارت"),
      ratio("rgb(255,255,255)", deep, 4.5, "سفید روی امروز"),
      ratio(clay, holiday, 4.5, "قرمز تعطیل روی خانهٔ تعطیل"),
      { label: "فاصله از قرمز تعطیل", value: `${Math.round(gap)}°`, ok: gap >= 25 },
    ]);
  }, [target]);
  return (
    <dl className="mt-3 grid grid-cols-[1fr_auto] gap-x-3 gap-y-1 text-[0.6875rem]">
      {rows.map((row) => (
        <div key={row.label} className="contents">
          <dt className="text-muted">{row.label}</dt>
          <dd className={`tabular-nums ${row.ok ? "text-ink" : "font-semibold text-clay"}`} dir="ltr">{row.value}{row.ok ? "" : " ✕"}</dd>
        </div>
      ))}
    </dl>
  );
}

const DAYS = Array.from({ length: 30 }, (_, i) => i + 1);

function Card({ accent, mode }: { accent: Accent; mode: "light" | "dark" }) {
  const ref = useRef<HTMLDivElement>(null);
  return (
    <div ref={ref} style={vars(accent[mode], mode)} className="rounded-2xl border border-line bg-paper p-4 text-ink">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-sm font-semibold text-forest">{accent.label}</span>
        <span className="text-[0.6875rem] text-muted">{mode === "light" ? "روشن" : "تیره"}</span>
      </div>
      <div className="rounded-xl border border-line bg-surface p-3">
        <div className="mb-2 flex items-center justify-between text-xs">
          <span className="font-semibold">شهریور ۱۴۰۵</span>
          <span className="rounded-md bg-leaf px-2 py-0.5 text-forest">امروز</span>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center text-[0.6875rem] tabular-nums">
          {DAYS.map((day) => (
            <span key={day} className={`rounded-md py-1 ${day === 20 ? "bg-forest-deep font-semibold text-white" : day === 8 || day === 7 || day === 14 || day === 21 || day === 28 ? "bg-holiday text-clay" : "text-ink"}`}>
              {day.toLocaleString("fa-IR")}
            </span>
          ))}
        </div>
        <p className="mt-3 text-xs">۸ شهریور — میلاد پیامبر اکرم (ص)</p>
        <p className="text-[0.6875rem] text-muted">۲۰ شهریور ۱۴۰۵ · ۱۱ سپتامبر ۲۰۲۶</p>
        <div className="mt-2 flex rounded-lg bg-paper p-0.5 text-[0.6875rem]">
          <span className="rounded-md bg-surface px-2.5 py-1 font-medium text-forest shadow-sm">ماه</span>
          <span className="px-2.5 py-1 text-muted">سال</span>
        </div>
      </div>
      <Measurements target={ref} />
    </div>
  );
}

export function SandboxColors() {
  return (
    <div className="space-y-6">
      {ACCENTS.map((accent) => (
        <section key={accent.id} className="grid gap-4 sm:grid-cols-2">
          <Card accent={accent} mode="light" />
          <Card accent={accent} mode="dark" />
        </section>
      ))}
    </div>
  );
}
