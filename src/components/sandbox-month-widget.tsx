// ============================================================================
// Source: src/components/sandbox-month-widget.tsx
// Version: 0.1.0 — 2026-10-10
// Why: SANDBOX for an Android month widget. Three variants drawn with the real
//      month grid and the real occasions, at Android's minimum cell sizes, each
//      measured live (row height, smallest text, whether it overflows). Colours
//      are the widget's own: forest/clay blocks with paper text, as wide B.
//      Unlinked and noindex. Delete with app/sandbox/month-widget once Farjad has picked.
// Env / Deps: lib/calendar, lib/events.
// ============================================================================

"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { dayKey, fa, monthGrid, MONTHS, toCalendar, WEEKDAYS } from "@/lib/calendar";
import { DEFAULT_GROUPS, eventsForDate } from "@/lib/events";

// Android's minimum widget sizes in dp, portrait, from the developer docs' table:
// 4 cells wide = 276; 2 rows = 220, 3 rows = 337. One CSS px stands for one dp here.
const SIZES = { "4x2": { w: 276, h: 220, label: "۴×۲" }, "4x3": { w: 276, h: 337, label: "۴×۳" } } as const;
const INITIALS = ["ش", "ی", "د", "س", "چ", "پ", "ج"];

type Cell = { key: string; day: number; inMonth: boolean; today: boolean; off: boolean; occasion: boolean };

function cellsFor(year: number, month: number, today: Date): Cell[] {
  const todayKey = dayKey(today);
  return monthGrid(year, month).map(({ date, persian, inMonth, isFriday }) => {
    const events = inMonth ? eventsForDate(date, DEFAULT_GROUPS) : [];
    return {
      key: dayKey(date), day: persian.day, inMonth, today: dayKey(date) === todayKey,
      off: inMonth && (isFriday || events.some((e) => e.holiday)), occasion: events.length > 0,
    };
  });
}

// The grid all three share. `dense` drops the dots' gap for the narrow variant.
function Grid({ cells, dense = false }: { cells: Cell[]; dense?: boolean }) {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="grid grid-cols-7 text-center text-[9px] text-muted">{INITIALS.map((d, i) => <span key={d} className={i === 6 ? "text-clay" : ""}>{d}</span>)}</div>
      <div data-rows={cells.length / 7} className="grid min-h-0 flex-1 grid-cols-7 grid-rows-[repeat(var(--rows),minmax(0,1fr))] [--rows:5] data-[rows='6']:[--rows:6]">
        {cells.map((c) => (
          <span key={c.key} data-cell className="flex flex-col items-center justify-center">
            <span className={`flex aspect-square items-center justify-center rounded-full leading-none tabular-nums ${dense ? "h-[17px] text-[10px]" : "h-[20px] text-[11px]"} ${c.today ? "bg-forest font-bold text-paper" : !c.inMonth ? "text-muted/40" : c.off ? "font-semibold text-clay" : "text-ink"}`}>{fa(c.day)}</span>
            <span className={`mt-px size-[3px] rounded-full ${c.occasion && !c.today ? (c.off ? "bg-clay" : "bg-muted") : "bg-transparent"}`} />
          </span>
        ))}
      </div>
    </div>
  );
}

function Frame({ size, children, onMeasure }: { size: keyof typeof SIZES; children: React.ReactNode; onMeasure: (m: Measure) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const { w, h } = SIZES[size];
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const cell = el.querySelector<HTMLElement>("[data-cell]");
    const texts = Array.from(el.querySelectorAll<HTMLElement>("*")).filter((n) => n.childElementCount === 0 && n.textContent?.trim());
    onMeasure({
      row: cell ? Math.round(cell.getBoundingClientRect().height * 10) / 10 : 0,
      smallest: Math.min(...texts.map((n) => parseFloat(getComputedStyle(n).fontSize))),
      overflow: Math.max(0, el.scrollHeight - el.clientHeight),
    });
  });
  return (
    <div ref={ref} dir="rtl" className={`overflow-hidden rounded-[22px] bg-surface font-[system-ui] shadow-sm ring-1 ring-line ${w === 276 ? "w-[276px]" : ""} ${h === 220 ? "h-[220px]" : "h-[337px]"}`}>{children}</div>
  );
}

type Measure = { row: number; smallest: number; overflow: number };

export function SandboxMonthWidget() {
  const today = new Date();
  const now = toCalendar(today);
  const [month, setMonth] = useState(now.month);
  const [dark, setDark] = useState(false);
  const year = now.year;
  const cells = cellsFor(year, month, today);
  const rows = cells.length / 7;
  const todayInView = cells.some((c) => c.today);
  const todayEvents = eventsForDate(today, DEFAULT_GROUPS);
  const todayOff = todayEvents.some((e) => e.holiday) || new Intl.DateTimeFormat("en-US", { weekday: "short", timeZone: "Asia/Tehran" }).format(today) === "Fri";
  // The month's occasions from today on (or from day 1 for another month), for C.
  const upcoming = monthGrid(year, month).filter((c) => c.inMonth && (month !== now.month || c.persian.day >= now.day))
    .flatMap((c) => eventsForDate(c.date, DEFAULT_GROUPS).map((e) => ({ day: c.persian.day, title: e.title, holiday: e.holiday })))
    .slice(0, 3);
  const [m, setM] = useState<Record<string, Measure>>({});
  const measure = (id: string) => (v: Measure) => setM((old) => (old[id]?.row === v.row && old[id]?.overflow === v.overflow && old[id]?.smallest === v.smallest ? old : { ...old, [id]: v }));
  useLayoutEffect(() => {
    document.documentElement.dataset.theme = dark ? "dark" : "light";
  }, [dark]);

  const header = (
    <div className="flex items-baseline justify-between px-3 pt-2.5 pb-1">
      <span className="text-[14px] font-bold text-ink">{MONTHS[month - 1]} <span className="font-normal text-muted">{fa(year)}</span></span>
      {todayInView && <span className="text-[10px] text-muted">{WEEKDAYS[(cells.findIndex((c) => c.today)) % 7]}</span>}
    </div>
  );

  const variants = [
    {
      id: "A", size: "4x2" as const, title: "A — فقط ماه",
      note: "سرتیتر ماه و سال، و خود جدول. امروز دایرهٔ سبز، جمعه و تعطیل قرمز، نقطه یعنی مناسبت. ساده‌ترین و پرجاترین جدول.",
      body: <div className="flex h-full flex-col pb-2">{header}<div className="flex min-h-0 flex-1 px-2"><Grid cells={cells} /></div></div>,
    },
    {
      id: "B", size: "4x2" as const, title: "B — امروز کنار ماه",
      note: "همان بلوک ویجت پهن (امروز، ماه، روز هفته) سمت راست و جدول کنارش. با ویجت‌های فعلی یک خانواده است، ولی جدول باریک‌تر می‌شود.",
      body: (
        <div className="flex h-full">
          <div className={`flex w-[78px] shrink-0 flex-col items-center justify-center text-paper ${todayOff ? "bg-clay" : "bg-forest"}`}>
            <span className="text-[34px] leading-none font-black tabular-nums">{fa(now.day)}</span>
            <span className="mt-1 text-[12px]">{MONTHS[now.month - 1]}</span>
            <span className="mt-0.5 text-[10px] opacity-80">{WEEKDAYS[(monthGrid(now.year, now.month).findIndex((c) => dayKey(c.date) === dayKey(today))) % 7]}</span>
          </div>
          <div className="flex min-w-0 flex-1 flex-col pb-2">
            <div className="px-2 pt-2 pb-0.5 text-[12px] font-bold text-ink">{MONTHS[month - 1]} <span className="font-normal text-muted">{fa(year)}</span></div>
            <div className="flex min-h-0 flex-1 px-1"><Grid cells={cells} dense /></div>
          </div>
        </div>
      ),
    },
    {
      id: "C", size: "4x3" as const, title: "C — ماه و مناسبت‌ها",
      note: "جدول A و زیرش سه مناسبت بعدی همین ماه. یک ردیف خانه بلندتر روی صفحه می‌گیرد، ولی چیزی که با نقطه گفته می‌شود اینجا اسم دارد.",
      body: (
        <div className="flex h-full flex-col pb-2">
          {header}
          <div className="flex h-[188px] shrink-0 px-2"><Grid cells={cells} /></div>
          <div className="mx-3 mt-1.5 border-t border-line pt-1.5">
            {upcoming.length ? upcoming.map((u, i) => (
              <div key={i} className="flex items-baseline gap-2 py-0.5 text-[11px]"><span className={`w-5 shrink-0 text-center tabular-nums ${u.holiday ? "text-clay" : "text-muted"}`}>{fa(u.day)}</span><span className={`truncate ${u.holiday ? "text-clay" : "text-ink"}`}>{u.title}</span></div>
            )) : <div className="py-0.5 text-[11px] text-muted">مناسبتی در ادامهٔ این ماه نیست.</div>}
          </div>
        </div>
      ),
    },
  ];

  return (
    <>
      <div className="mb-8 flex flex-wrap items-center gap-3 text-xs">
        <label className="flex items-center gap-2 text-muted">ماه
          <select value={month} onChange={(e) => setMonth(Number(e.target.value))} className="rounded-lg border border-line bg-surface px-2 py-1 text-ink">
            {MONTHS.map((name, i) => <option key={name} value={i + 1}>{name} {[3, 5, 8].includes(i + 1) ? "(شش ردیف)" : ""}</option>)}
          </select>
        </label>
        <button onClick={() => setDark(!dark)} className="rounded-lg border border-line px-3 py-1 text-ink">{dark ? "روشن" : "تیره"}</button>
        <span className="text-muted">این ماه: {fa(rows)} ردیف</span>
      </div>
      <div className="grid gap-10 md:grid-cols-3">
        {variants.map((v) => (
          <section key={v.id}>
            <h2 className="mb-1 text-sm font-semibold text-ink">{v.title}</h2>
            <p className="mb-4 min-h-18 text-xs leading-6 text-muted">{v.note}</p>
            <div className="rounded-3xl bg-muted/40 p-5"><Frame size={v.size} onMeasure={measure(v.id)}>{v.body}</Frame></div>
            <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1 text-[11px] text-muted">
              <dt>اندازه</dt><dd className="tabular-nums text-ink">{SIZES[v.size].label} · {SIZES[v.size].w}×{SIZES[v.size].h}dp</dd>
              <dt>بلندی هر ردیف</dt><dd className="tabular-nums text-ink">{m[v.id]?.row ?? "…"}dp</dd>
              <dt>ریزترین متن</dt><dd className="tabular-nums text-ink">{m[v.id]?.smallest ?? "…"}sp</dd>
              <dt>بیرون‌زدگی</dt><dd className={`tabular-nums ${m[v.id]?.overflow ? "text-clay" : "text-ink"}`}>{m[v.id] ? (m[v.id].overflow ? `${m[v.id].overflow}dp — جا نمی‌شود` : "ندارد") : "…"}</dd>
            </dl>
          </section>
        ))}
      </div>
    </>
  );
}
