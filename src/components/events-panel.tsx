"use client";

import { useState } from "react";
import { ArrowUpLeft, Leaf, Info } from "lucide-react";
import { dayKey, fa, formatDate, fromCalendar, MONTHS, monthLength } from "@/lib/calendar";
import { EVENTS_NOTICE, eventsForDate } from "@/lib/events";

export function EventsPanel({ year, month, selected, onSelect }: { year: number; month: number; selected: Date; onSelect: (date: Date) => void }) {
  const [filter, setFilter] = useState("all");
  const selectedEvents = eventsForDate(selected);
  const events = Array.from({ length: monthLength(year, month) }, (_, i) => {
    const date = fromCalendar({ year, month, day: i + 1 });
    return eventsForDate(date).map((event) => ({ ...event, date, day: i + 1 }));
  }).flat().filter((event) => filter === "all" || event.category === filter);
  return (
    <aside className="flex min-w-0 flex-col rounded-[1.75rem] border border-line bg-white">
      <div className="px-6 pt-6 pb-5">
        <div className="flex items-center justify-between"><h2 className="text-lg font-semibold">روزِ انتخاب‌شده</h2><Leaf size={18} className="text-forest" /></div>
        <p data-testid="selected-date" className="mt-3 text-sm font-medium text-forest">{formatDate(selected, "persian", true)}</p>
        <div data-testid="selected-events" aria-live="polite" className="mt-3 text-xs leading-6 text-muted">{selectedEvents.length ? selectedEvents.map((event, i) => <p key={i} className={event.holiday ? "text-clay" : ""}>{event.title}{event.holiday && " · تعطیل"}</p>) : <p>در فهرست ما مناسبتی برای این روز ثبت نشده.</p>}</div>
      </div>
      <div className="flex items-center justify-between border-y border-line px-6 py-4"><h3 className="text-sm font-semibold">مناسبت‌های {MONTHS[month - 1]}</h3><span className="rounded-md bg-paper px-2 py-1 text-[10px] text-muted">{fa(events.length)} مناسبت</span></div>
      <div className="flex gap-1 px-6 pt-4">{[{ key: "all", label: "همه" }, { key: "iran", label: "ایرانی" }, { key: "world", label: "جهانی" }].map((item) => <button key={item.key} aria-pressed={filter === item.key} onClick={() => setFilter(item.key)} className={`rounded-lg px-3 py-1.5 text-[11px] transition-colors ${filter === item.key ? "bg-leaf font-medium text-forest" : "text-muted hover:bg-paper"}`}>{item.label}</button>)}</div>
      <div className="mt-2 max-h-[260px] flex-1 overflow-y-auto px-6 pb-2">
        {events.length ? events.map((event, i) => <button key={`${event.day}-${i}`} onClick={() => onSelect(event.date)} className={`group flex w-full items-start gap-3 border-b border-line py-3.5 text-right last:border-0 ${dayKey(event.date) === dayKey(selected) ? "text-forest" : "text-ink"}`}><span className={`mt-0.5 min-w-7 text-xl leading-6 font-medium tabular-nums ${event.holiday ? "text-clay" : "text-muted"}`}>{fa(event.day)}</span><span className="flex-1 text-xs leading-6 group-hover:text-forest">{event.title}{event.holiday && <span className="mr-2 text-[10px] text-clay">تعطیل</span>}</span><ArrowUpLeft size={13} className="mt-1.5 shrink-0 text-muted opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100" /></button>) : <p className="py-8 text-center text-xs text-muted">مناسبتی در این دسته ثبت نشده.</p>}
      </div>
      <details className="mx-6 mt-3 mb-5 rounded-lg bg-paper p-3 text-[10px] leading-6 text-muted"><summary className="flex cursor-pointer items-center gap-1.5"><Info size={13} />دربارهٔ پوشش مناسبت‌ها</summary><p className="pt-2">{EVENTS_NOTICE}</p></details>
    </aside>
  );
}
