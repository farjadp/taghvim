// ============================================================================
// Source: src/components/sandbox-settings-panel.tsx
// Version: 0.1.0 — 2026-09-10
// Why: SANDBOX. Four renderings of the display-settings panel side by side —
//      today's, and three ways out of the overflow reported by email and by
//      @SepehrHashemi (#91) — each measured live rather than eyeballed.
// Env / Deps: Real FONTS/SIZES/THEMES and real PALETTES, so the widths are the
//      widths. Throwaway: delete with app/sandbox/settings-panel/page.tsx.
// ============================================================================

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Settings2 } from "lucide-react";
import { FONTS, SIZES, THEMES, type Font } from "@/lib/preferences";
import { PALETTES } from "@/lib/card-style";

type Variant = "current" | "scroll" | "stacked" | "wide";

const VARIANTS: { id: Variant; name: string; how: string; cost: string }[] = [
  { id: "current", name: "امروز", how: "ردیف تک‌خط، بدون shrink — همان چیزی که کاربر گزارش کرد", cost: "—" },
  { id: "scroll", name: "الف · اسکرول افقی", how: "کنترل min-w-0 و overflow-x-auto می‌گیرد؛ چیپ‌ها shrink-0", cost: "دو خط CSS" },
  { id: "stacked", name: "ب · برچسب بالا", how: "ردیف قلم عمودی می‌شود: برچسب بالا، چیپ‌ها زیرش با wrap", cost: "یک prop روی Choice" },
  { id: "wide", name: "پ · پنل پهن‌تر", how: "پنل از w-72 به w-96 می‌رود؛ چیدمان دست‌نخورده", cost: "یک کلاس" },
];

type Measured = {
  panelWidth: number;
  contentWidth: number;
  fontRowNeeds: number;
  fontRowHas: number;
  overflow: number;
  escapesCard: number;
  chipsFullyVisible: number;
  chipsTotal: number;
};

// One row of the menu, in whichever of the two shapes the variant asks for.
function Choice<T extends string>({ label, options, value, onChange, shape, mark }: {
  label: string;
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  shape: "row" | "stacked" | "scroll";
  mark?: boolean;
}) {
  const chips = (
    <div
      data-control={mark ? "font" : undefined}
      className={`flex rounded-lg bg-paper p-0.5 ${shape === "scroll" ? "min-w-0 overflow-x-auto scrollbar-hidden" : ""} ${shape === "stacked" ? "flex-wrap gap-0.5" : ""}`}
    >
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          data-chip={mark ? "font" : undefined}
          aria-pressed={value === option.value}
          onClick={() => onChange(option.value)}
          className={`shrink-0 rounded-md px-2.5 py-1 text-[0.6875rem] transition-colors ${value === option.value ? "bg-surface font-medium text-forest shadow-sm" : "text-muted hover:text-ink"}`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
  if (shape === "stacked") {
    return <div role="group" aria-label={label} className="space-y-1.5">
      <span className="block text-xs text-muted">{label}</span>
      {chips}
    </div>;
  }
  return <div role="group" aria-label={label} className="flex items-center justify-between gap-4">
    <span className="shrink-0 text-xs text-muted">{label}</span>
    {chips}
  </div>;
}

function Panel({ variant, onMeasure }: { variant: Variant; onMeasure: (id: Variant, m: Measured) => void }) {
  const [font, setFont] = useState<Font>("shabnam");
  const [theme, setTheme] = useState(THEMES[0].value);
  const [size, setSize] = useState(SIZES[1].value);
  const panel = useRef<HTMLDivElement>(null);

  const measure = useCallback(() => {
    const el = panel.current;
    if (!el) return;
    const box = el.getBoundingClientRect();
    const style = getComputedStyle(el);
    const contentLeft = box.left + parseFloat(style.paddingLeft);
    const contentRight = box.right - parseFloat(style.paddingRight);
    const control = el.querySelector<HTMLElement>('[data-control="font"]');
    const chips = [...el.querySelectorAll<HTMLElement>('[data-chip="font"]')];
    // A chip inside a scrolling control is CLIPPED, not spilled: its rect still
    // reaches past the card but nothing paints there. Intersect the ancestors
    // that actually clip, so "escapes the card" means escapes on screen.
    const paintedRect = (chip: HTMLElement) => {
      const r = chip.getBoundingClientRect();
      let left = r.left, right = r.right;
      for (let node = chip.parentElement; node && node !== el.parentElement; node = node.parentElement) {
        const cs = getComputedStyle(node);
        if (cs.overflowX === "visible" && cs.overflowY === "visible") continue;
        const c = node.getBoundingClientRect();
        left = Math.max(left, c.left);
        right = Math.min(right, c.right);
      }
      return { left, right, width: Math.max(0, right - left), full: right - left >= r.width - 0.5 };
    };
    let escapes = 0;
    let visible = 0;
    for (const chip of chips) {
      const p = paintedRect(chip);
      if (p.width <= 0.5) continue;
      escapes = Math.max(escapes, contentLeft - p.left, p.right - contentRight);
      if (p.full && p.left >= contentLeft - 0.5 && p.right <= contentRight + 0.5) visible += 1;
    }
    onMeasure(variant, {
      panelWidth: Math.round(box.width),
      contentWidth: Math.round(contentRight - contentLeft),
      fontRowNeeds: control ? Math.round(control.scrollWidth) : 0,
      fontRowHas: control ? Math.round(control.clientWidth) : 0,
      overflow: Math.max(0, Math.round(el.scrollWidth - el.clientWidth)),
      escapesCard: Math.max(0, Math.round(escapes)),
      chipsFullyVisible: visible,
      chipsTotal: chips.length,
    });
  }, [variant, onMeasure]);

  // Fonts change the widths, so measure only once the faces have settled.
  useEffect(() => {
    let alive = true;
    const run = () => { if (alive) measure(); };
    document.fonts.ready.then(run);
    const observer = new ResizeObserver(run);
    if (panel.current) observer.observe(panel.current);
    return () => { alive = false; observer.disconnect(); };
  }, [measure]);

  const shape = variant === "scroll" ? "scroll" : variant === "stacked" ? "stacked" : "row";
  return (
    <div ref={panel} className={`space-y-3 rounded-2xl border border-line bg-surface p-4 shadow-lg ${variant === "wide" ? "w-96" : "w-72"}`}>
      <Choice label="پوسته" options={THEMES} value={theme} onChange={setTheme} shape={variant === "stacked" ? "row" : shape} />
      <Choice label="اندازهٔ قلم" options={SIZES} value={size} onChange={setSize} shape={variant === "stacked" ? "row" : shape} />
      <Choice label="قلم" options={FONTS} value={font} onChange={setFont} shape={shape} mark />
      <div className="border-t border-line pt-3">
        <span className="block text-xs text-muted">پس‌زمینهٔ تصویر روز</span>
        <div className="mt-2 grid grid-cols-6 gap-1.5">
          {PALETTES.map((palette) => (
            <span key={palette.id} title={palette.label} className="size-9 rounded-lg border border-line" style={{ backgroundColor: palette.colours.background }} />
          ))}
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, bad }: { label: string; value: string; bad?: boolean }) {
  return <div className="flex justify-between gap-3 text-xs">
    <span className="text-muted">{label}</span>
    <span className={bad ? "font-medium text-clay" : "text-ink"}>{value}</span>
  </div>;
}

export function SandboxSettingsPanel() {
  const [measurements, setMeasurements] = useState<Partial<Record<Variant, Measured>>>({});
  const onMeasure = useCallback((id: Variant, m: Measured) => {
    setMeasurements((prev) => JSON.stringify(prev[id]) === JSON.stringify(m) ? prev : { ...prev, [id]: m });
  }, []);
  return (
    <main dir="rtl" className="mx-auto max-w-6xl px-6 py-10">
      <h1 className="text-lg font-medium text-ink">پنل تنظیمات — سه راه‌حل سرریز</h1>
      <p className="mt-2 max-w-2xl text-sm text-muted">
        ردیف «قلم» از لبهٔ چپ کارت بیرون می‌زند. گزارش‌ها: ایمیل e.kashfi@icloud.com با اسکرین‌شات، و کامنت #91.
        هر پنل زیر واقعی است — همان قلم‌ها، همان برچسب‌ها، همان پالت‌ها — و اعداد پای هرکدام همان لحظه از DOM خوانده می‌شوند.
      </p>
      <div className="mt-8 grid gap-6 lg:grid-cols-4">
        {VARIANTS.map((variant) => {
          const m = measurements[variant.id];
          return (
            <section key={variant.id} className="space-y-3">
              <header className="space-y-1">
                <h2 className="text-sm font-medium text-ink">{variant.name}</h2>
                <p className="text-xs leading-relaxed text-muted">{variant.how}</p>
              </header>
              <div className="flex items-center gap-2">
                <span className="icon-button size-9"><Settings2 size={17} /></span>
                <span className="text-[0.625rem] text-muted">دکمهٔ چرخ‌دنده، برای مقیاس</span>
              </div>
              <div className="overflow-visible">
                <Panel variant={variant.id} onMeasure={onMeasure} />
              </div>
              <div className="space-y-1 rounded-xl border border-line bg-paper p-3">
                {m ? <>
                  <Row label="عرض پنل" value={`${m.panelWidth}px`} />
                  <Row label="فضای محتوا" value={`${m.contentWidth}px`} />
                  <Row label="کنترل قلم لازم دارد" value={`${m.fontRowNeeds}px`} />
                  <Row label="کنترل قلم فضا دارد" value={`${m.fontRowHas}px`} />
                  <Row label="سرریز پنل" value={m.overflow ? `${m.overflow}px` : "ندارد"} bad={m.overflow > 0} />
                  <Row label="بیرون‌زدگی از کارت" value={m.escapesCard ? `${m.escapesCard}px` : "ندارد"} bad={m.escapesCard > 0} />
                  <Row label="چیپ کامل دیده‌شده" value={`${m.chipsFullyVisible} از ${m.chipsTotal}`} bad={m.chipsFullyVisible < m.chipsTotal} />
                </> : <p className="text-xs text-muted">در حال اندازه‌گیری…</p>}
              </div>
              <p className="text-[0.625rem] text-muted">هزینه: {variant.cost}</p>
            </section>
          );
        })}
      </div>
      <p className="mt-10 text-xs text-muted">
        هر سه راه‌حل در <code className="text-ink">Choice</code> اعمال می‌شود، نه در ردیف قلم — چون هر ردیفی که یک گزینه اضافه کند همین‌طور می‌شکند.
      </p>
    </main>
  );
}
