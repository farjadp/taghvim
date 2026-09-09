// ============================================================================
// Source: src/components/sandbox-bridges.tsx
// Version: 0.2.0 — 2026-09-09
// Why: SANDBOX. Where the bridges panel goes: a full-width row under the
//      calendar, in a replica of the real page, with every block's position
//      measured so the mobile question is decided on numbers.
// Env / Deps: The real panels and the real data; only `main`'s markup is copied
//      from calendar-app.tsx. Delete this file and src/app/sandbox/bridges/page.tsx
//      to drop the sandbox; bridges-panel.tsx and lib/bridges.ts stand alone.
// ============================================================================

"use client";

import { useEffect, useRef, useState } from "react";
import { fa, shiftMonth, toCalendar } from "@/lib/calendar";
import { ALL_GROUPS, DEFAULT_GROUPS, type EventGroups } from "@/lib/events";
import { DEFAULT_VIEW, type ViewPreferences } from "@/lib/view";
import { TodayPanel } from "./today-panel";
import { CalendarPanel } from "./calendar-panel";
import { EventsPanel } from "./events-panel";
import { ToolsPanel, type ToolTab } from "./tools-panel";
import { BridgesPanel } from "./bridges-panel";

// The blocks whose position on the page is the actual question here.
const BLOCKS = [
  { key: "calendar", label: "تقویم ماهانه", selector: "#calendar" },
  { key: "bridges", label: "پل‌های تعطیلات", selector: "[aria-labelledby='bridges-title']" },
  { key: "hero", label: "هیرو (تاریخ و ساعت)", selector: "[aria-label='تاریخ و ساعت امروز']" },
  { key: "tools", label: "ابزارهای تاریخ", selector: "#tools" },
] as const;

type Placement = "under-calendar" | "after-hero";
type Layout = "grid" | "rows";

function Choice<T extends string>({ label, value, options, onChange }: {
  label: string; value: T; options: ReadonlyArray<readonly [T, string]>; onChange: (next: T) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[0.6875rem] text-muted">{label}</span>
      <div className="flex gap-1">
        {options.map(([key, text]) => (
          <button key={key} aria-pressed={value === key} onClick={() => onChange(key)}
            className={`rounded-lg px-3 py-1.5 text-[0.6875rem] ${value === key ? "bg-leaf font-medium text-forest" : "text-muted hover:bg-paper"}`}>
            {text}
          </button>
        ))}
      </div>
    </div>
  );
}

export function SandboxBridges({ initialNow }: { initialNow: string }) {
  const now = new Date(initialNow);
  const [selected, setSelected] = useState(now);
  const [view, setView] = useState(() => toCalendar(now));
  const [tool, setTool] = useState<ToolTab>("convert");
  const [groups, setGroups] = useState<EventGroups>(DEFAULT_GROUPS);
  const [placement, setPlacement] = useState<Placement>("under-calendar");
  const [layout, setLayout] = useState<Layout>("grid");
  const [measurements, setMeasurements] = useState<{ key: string; top: number; height: number }[]>([]);
  const [width, setWidth] = useState(0);
  const preferences: ViewPreferences = { ...DEFAULT_VIEW, ...groups };
  const mainRef = useRef<HTMLElement>(null);

  // Measured after every render and again on every resize. A ResizeObserver would be the
  // obvious tool and is deliberately not used: it never fires in the headless browser these
  // numbers get read in, so it would report a confident zero.
  const measure = () => {
    const main = mainRef.current;
    if (!main) return;
    const origin = main.getBoundingClientRect().top + window.scrollY;
    const next = BLOCKS.map(({ key, selector }) => {
      const node = main.querySelector(selector);
      if (!node) return { key, top: -1, height: 0 };
      const box = node.getBoundingClientRect();
      return { key, top: Math.round(box.top + window.scrollY - origin), height: Math.round(box.height) };
    });
    setMeasurements((current) => (JSON.stringify(current) === JSON.stringify(next) ? current : next));
    setWidth(window.innerWidth);
  };
  useEffect(measure);
  useEffect(() => {
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // On phones the calendar row carries `order-first`. Giving the bridges row the same order
  // keeps it directly under the calendar, because equal order values fall back to DOM order.
  // Leaving it off drops the row to its natural place, under the hero.
  const bridgesOrder = placement === "under-calendar" ? "order-first" : "";

  return (
    <div className="mx-auto max-w-[1240px] px-4 pb-16 sm:px-8">
      <div className="sticky top-0 z-30 -mx-4 border-b border-line bg-surface px-4 py-4 sm:-mx-8 sm:px-8">
        <h1 className="text-sm font-semibold">سندباکس · جای پنل پل‌ها</h1>
        <p className="mt-1 text-[0.6875rem] leading-5 text-muted">
          ساختار واقعی صفحهٔ اصلی با پنل‌های واقعی؛ فقط مارک‌آپ <code>main</code> از <code>calendar-app.tsx</code> کپی شده. عددها اندازه‌گیری‌شده‌اند، نه تخمین.
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-2">
          <Choice label="جای ردیف در موبایل:" value={placement} onChange={setPlacement}
            options={[["under-calendar", "زیر تقویم"], ["after-hero", "بعد از هیرو"]] as const} />
          <Choice label="چیدمان کارت‌ها:" value={layout} onChange={setLayout}
            options={[["grid", "سه‌ستونه"], ["rows", "ردیف‌های تمام‌عرض"]] as const} />
          <Choice label="دسته‌ها:" value={groups === ALL_GROUPS ? "all" : "default"}
            onChange={(next) => setGroups(next === "all" ? ALL_GROUPS : DEFAULT_GROUPS)}
            options={[["default", "پیش‌فرض"], ["all", "همه"]] as const} />
        </div>
        <table className="mt-3 w-full max-w-md text-[0.625rem] tabular-nums">
          <thead className="text-muted"><tr><th className="text-right font-normal">بلوک</th><th className="text-right font-normal">از پیکسل</th><th className="text-right font-normal">قد</th></tr></thead>
          <tbody>
            {BLOCKS.map(({ key, label }) => {
              const found = measurements.find((item) => item.key === key);
              return (
                <tr key={key}>
                  <td className="py-0.5">{label}</td>
                  <td className={key === "bridges" ? "text-clay" : ""}>{fa(found?.top ?? 0)}</td>
                  <td className="text-muted">{fa(found?.height ?? 0)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <p className="mt-1 text-[0.625rem] text-muted">عرض پنجره: {fa(width)} پیکسل · زیر ۱۰۲۴ چیدمان موبایل است.</p>
      </div>

      {/* Copied from calendar-app.tsx: flex column on phones with the calendar row ordered
          first, plain block from lg up. The bridges row is the only addition. */}
      <main ref={mainRef} className="flex flex-col pt-8 pb-10 sm:pt-10 lg:block">
        <TodayPanel now={now} initialNow={initialNow} className="max-lg:mt-7" />
        <div className="order-first mt-7 grid items-stretch gap-5 max-lg:mt-0 lg:grid-cols-[1.7fr_1fr]">
          <CalendarPanel year={view.year} month={view.month} today={now} selected={selected} groups={preferences}
            memorial={preferences.memorial} onToggleView={() => {}} onSelect={setSelected}
            onNavigate={(delta) => setView({ ...shiftMonth(view.year, view.month, delta), day: 1 })}
            onToday={() => { setSelected(now); setView(toCalendar(now)); }}
            onJump={(year, month) => setView({ year, month, day: 1 })} />
          <EventsPanel year={view.year} month={view.month} selected={selected} groups={preferences} onSelect={setSelected} />
        </div>
        <BridgesPanel now={now} groups={groups} layout={layout} className={`mt-7 ${bridgesOrder}`} />
        <ToolsPanel now={now} tab={tool} onTabChange={setTool} />
      </main>
    </div>
  );
}
