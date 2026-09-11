// ============================================================================
// Source: src/components/calendar-panel.tsx
// Version: 0.9.8 — 2026-09-08
// Why: Monthly Jalali grid, RTL keyboard navigation and interactive legend.
//      Event groups and memorial visibility are controlled below the grid.
// Env / Deps: Pure UI; lib/events filters grid events with the same groups as the list.
// ============================================================================

"use client";

import { ChevronLeft, ChevronRight, RotateCcw, CalendarDays } from "lucide-react";
import { dayKey, fa, formatDate, fromCalendar, monthGrid, monthLength, toCalendar, WEEKDAYS } from "@/lib/calendar";
import { useMonthNames } from "./month-names-context";
import { eventsForDate, type EventGroups } from "@/lib/events";

const VIEW_SWITCHES = [
  { key: "religious", label: "مذهبی" },
  { key: "state", label: "دولتی" },
  { key: "world", label: "جهانی" },
  { key: "memorial", label: "یادبود" },
] as const;

interface CalendarPanelProps {
  year: number;
  month: number;
  today: Date;
  selected: Date;
  groups: EventGroups;
  memorial: boolean;
  // The extension's new tab renders no memorial panel, so a switch for it
  // would toggle nothing; it hides the control instead.
  showMemorialSwitch?: boolean;
  onToggleView: (key: keyof EventGroups | "memorial") => void;
  onSelect: (date: Date) => void;
  onNavigate: (delta: number) => void;
  onToday: () => void;
  onJump: (year: number, month: number) => void;
  // Marks a cell carrying one of the visitor's own dates from the «تاریخ‌های من» tool. Optional and inert
  // when not passed — the extension has no such list, and neither does a visitor with none.
  marked?: (date: Date) => boolean;
}

export function CalendarPanel({ year, month, today, selected, groups, memorial, showMemorialSwitch = true, onToggleView, onSelect, onNavigate, onToday, onJump, marked }: CalendarPanelProps) {
  const months = useMonthNames();
  const grid = monthGrid(year, month);
  const selectedParts = toCalendar(selected);
  const selectionInView = selectedParts.year === year && selectedParts.month === month;
  const start = fromCalendar({ year, month, day: 1 });
  const end = fromCalendar({ year, month, day: monthLength(year, month) });
  const englishMonth = (date: Date) => new Intl.DateTimeFormat("en-US", { month: "short", timeZone: "Asia/Tehran" }).format(date);
  return (
    <section id="calendar" aria-label="تقویم ماهانه" className="min-w-0 overflow-hidden rounded-[1.75rem] border border-line bg-surface">
      <div className="flex flex-wrap items-center justify-between gap-4 px-5 pt-6 pb-5 sm:px-7">
        <div className="flex items-center gap-3"><div className="flex gap-1"><button className="icon-button" aria-label="ماه قبل" disabled={year === 1200 && month === 1} onClick={() => onNavigate(-1)}><ChevronRight size={19} /></button><button className="icon-button" aria-label="ماه بعد" disabled={year === 1600 && month === 12} onClick={() => onNavigate(1)}><ChevronLeft size={19} /></button></div><div><h2 className="text-xl font-bold" aria-live="polite">{months[month - 1]} {fa(year)}</h2><p className="mt-1 text-[0.6875rem] text-muted" dir="ltr">{englishMonth(start)} – {englishMonth(end)} {toCalendar(end, "gregorian").year}</p></div></div>
        <button onClick={onToday} aria-label="برگشت به امروز" className="flex items-center gap-2 rounded-xl border border-line px-3 py-2 text-xs font-medium transition-colors hover:bg-leaf"><RotateCcw size={14} />امروز</button>
      </div>
      <div className="flex items-center justify-between gap-3 border-y border-line bg-paper/70 px-5 py-2.5 sm:px-7">
        <div className="flex items-center gap-2 text-xs text-muted"><CalendarDays size={14} /><span>تقویم خورشیدی</span></div>
        <div className="flex gap-2"><select aria-label="انتخاب ماه تقویم" value={month} onChange={(event) => onJump(year, Number(event.target.value))} className="max-w-24 bg-transparent text-xs text-ink">{months.map((name, index) => <option key={name} value={index + 1}>{name}</option>)}</select><select aria-label="انتخاب سال تقویم" value={year} onChange={(event) => onJump(Number(event.target.value), month)} className="max-w-20 bg-transparent text-xs text-ink">{Array.from({ length: 401 }, (_, i) => i + 1200).map((value) => <option key={value} value={value}>{fa(value)}</option>)}</select></div>
      </div>
      <div className="px-2 pt-3 pb-4 sm:px-5">
        <div className="grid grid-cols-7">{WEEKDAYS.map((name, i) => <div key={name} className={`py-3 text-center text-[0.625rem] font-medium sm:text-xs ${i === 6 ? "text-clay" : "text-muted"}`}><span className="hidden min-[420px]:inline">{name}</span><span className="min-[420px]:hidden">{["ش", "ی", "د", "س", "چ", "پ", "ج"][i]}</span></div>)}</div>
        {/* RTL keyboard grid: ArrowLeft moves forward in reading order, ArrowRight back */}
        <div role="group" aria-label="روزهای ماه؛ جابه‌جایی با کلیدهای جهت‌نما" className="grid grid-cols-7 gap-1 sm:gap-1.5" onKeyDown={(event) => {
          const buttons = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>("button"));
          const index = buttons.indexOf(event.target as HTMLButtonElement);
          if (index < 0) return;
          const next = event.key === "ArrowLeft" ? index + 1 : event.key === "ArrowRight" ? index - 1 : event.key === "ArrowDown" ? index + 7 : event.key === "ArrowUp" ? index - 7 : event.key === "Home" ? index - index % 7 : event.key === "End" ? index + 6 - index % 7 : -1;
          if (!["ArrowLeft", "ArrowRight", "ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) return;
          event.preventDefault();
          if (!buttons[next] || buttons[next].disabled) return;
          buttons[next].focus();
          buttons[next].click();
        }}>
          {grid.map(({ date, persian, inMonth, isFriday }) => {
            const supported = persian.year >= 1200 && persian.year <= 1600;
            const events = supported ? eventsForDate(date, groups) : [];
            // Both secondary calendars on every cell: Gregorian (LTR digits) and Hijri (Persian digits)
            const hijriDay = supported ? toCalendar(date, "islamic").day : 0;
            const active = supported && dayKey(date) === dayKey(selected);
            const isToday = supported && dayKey(date) === dayKey(today);
            // Friday is always a holiday; other holidays come from the (group-filtered) events
            const holiday = isFriday || events.some((event) => event.holiday);
            const nonFridayHoliday = holiday && !isFriday;
            return <button key={date.toISOString()} disabled={!supported} tabIndex={active || (!selectionInView && inMonth && persian.day === 1) ? 0 : -1} onClick={() => onSelect(date)} aria-label={`${fa(persian.day)} ${months[persian.month - 1]} ${fa(persian.year)}`} aria-pressed={active} aria-current={isToday ? "date" : undefined} className={`relative flex min-h-[66px] flex-col items-center justify-center gap-1 rounded-xl border sm:min-h-[77px] ${active ? "border-forest bg-forest-deep text-memorial-ink shadow-sm" : isToday ? "border-forest bg-leaf text-forest" : !inMonth ? "border-transparent text-muted hover:bg-paper" : holiday ? "border-clay/40 bg-holiday text-clay hover:bg-holiday-hover" : "border-transparent text-ink hover:bg-leaf"}`}>
              <span className={`text-lg leading-6 tabular-nums sm:text-[1.375rem] ${holiday && !active ? "font-bold" : "font-medium"}`}>{fa(persian.day)}</span>
              <span className={`flex items-center gap-1 text-[0.625rem] leading-none tabular-nums sm:text-[0.6875rem] ${active ? "text-memorial-ink/80" : "text-muted"}`}><span dir="ltr">{date.getUTCDate()}</span>{supported && <><span aria-hidden="true">·</span><span>{fa(hijriDay)}</span></>}</span>
              {events.length > 0 && <span className={`absolute bottom-1.5 size-1.5 rounded-full ${active ? "bg-memorial-ink/80" : holiday ? "bg-clay" : "bg-forest/60"}`} />}
              {nonFridayHoliday && !active && <span className="absolute right-1.5 top-1.5 size-1.5 rounded-full bg-clay" />}
              {supported && marked?.(date) && <span className={`absolute left-1.5 top-1.5 size-1.5 rounded-full ${active ? "bg-memorial-ink/80" : "bg-forest"}`} />}
            </button>;
          })}
        </div>
      </div>
      <div data-testid="calendar-legend" className="border-t border-line px-5 py-4 text-[0.625rem] text-muted sm:px-7">
        <div className="flex flex-wrap items-center justify-between gap-2"><div className="flex flex-wrap gap-4"><span className="flex items-center gap-1.5"><span className="size-2 rounded bg-holiday border border-clay/40" />تعطیلی رسمی</span><span className="flex items-center gap-1.5"><span className="size-1.5 rounded-full bg-clay" />مناسبت تعطیلی</span><span className="flex items-center gap-1.5"><span className="size-1.5 rounded-full bg-forest/60" />مناسبت</span>{marked && <span className="flex items-center gap-1.5"><span className="size-1.5 rounded-full bg-forest" />تاریخ‌های من</span>}</div><span>اعداد کوچک: میلادی · قمری</span></div>
        <div data-testid="view-controls" className="mt-2.5 flex flex-wrap items-center gap-2">
          <span className="text-[0.625rem] text-muted">نمایش:</span>
          <span className="flex items-center gap-1.5 rounded-full border border-line px-2.5 py-1 text-[0.625rem] text-muted"><span aria-hidden="true" className="size-1.5 rounded-full bg-forest-deep" />ملی و فرهنگی</span>
          {VIEW_SWITCHES.filter(({ key }) => showMemorialSwitch || key !== "memorial").map(({ key, label }) => {
            const on = key === "memorial" ? memorial : groups[key];
            return <button key={key} type="button" role="switch" aria-checked={on} onClick={() => onToggleView(key)} className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[0.625rem] transition-colors ${on ? "border-forest bg-leaf text-forest" : "border-line text-muted hover:text-forest"}`}><span aria-hidden="true" className={`size-1.5 rounded-full ${on ? "bg-forest-deep" : "bg-line"}`} />{label}</button>;
          })}
        </div>
      </div>
      <p className="sr-only">روز انتخاب‌شده: {formatDate(selected)}</p>
    </section>
  );
}
