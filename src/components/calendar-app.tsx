// ============================================================================
// Source: src/components/calendar-app.tsx
// Version: 0.9.16 — 2026-09-09
// Why: Client shell that owns app state: live Tehran clock, selected day,
//      visible month, active tool tab and independent event/panel visibility.
// Env / Deps: lib/view guards taghvim-view persistence and legacy migration.
// ============================================================================

"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ArrowLeftRight, CalendarDays, Hourglass, MapPin } from "lucide-react";
import { dayKey, shiftMonth, toCalendar } from "@/lib/calendar";
import { DEFAULT_VIEW, readView, saveView, type ViewPreferences } from "@/lib/view";
import { datesOn, readDates, type Anniversary } from "@/lib/dates";
import type { Person } from "@/lib/javidnaman";
import { TodayPanel } from "./today-panel";
import { CalendarPanel } from "./calendar-panel";
import { EventsPanel } from "./events-panel";
import { DEFAULT_TOOL, ToolsPanel, type ToolTab } from "./tools-panel";
import { PrayerPanel } from "./prayer-panel";
import { MemorialPanel } from "./memorial-panel";
import { SettingsMenu } from "./settings-menu";
import { SiteFooter } from "./site-footer";

function BrandMark() {
  return <Image src="/icon.svg" width={40} height={40} alt="" unoptimized className="size-10 shrink-0" />;
}

export function CalendarApp({ initialNow, person }: { initialNow: string; person: Person }) {
  const [now, setNow] = useState(new Date(initialNow));
  const [selected, setSelected] = useState(new Date(initialNow));
  const [view, setView] = useState(() => toCalendar(new Date(initialNow)));
  const [tool, setTool] = useState<ToolTab>(DEFAULT_TOOL);
  // Defaults match server rendering; read/migrate browser preferences only after hydration.
  const [preferences, setPreferences] = useState<ViewPreferences>(DEFAULT_VIEW);
  // The visitor's own dates, read once after hydration like the preferences beside them.
  const [dates, setDates] = useState<Anniversary[]>([]);
  const followingToday = useRef(true);
  useEffect(() => { setPreferences(readView()); setDates(readDates()); }, []);
  function toggleView(key: keyof ViewPreferences) {
    const next = { ...preferences, [key]: !preferences[key] };
    setPreferences(next);
    saveView(next);
  }
  useEffect(() => {
    let lastDay = dayKey(new Date(initialNow));
    let lastMinute = -1;
    function update() {
      const actual = new Date();
      const minute = Math.floor(actual.getTime() / 60_000);
      if (minute === lastMinute) return;
      lastMinute = minute;
      const currentDay = dayKey(actual);
      if (currentDay !== lastDay && followingToday.current) {
        setSelected(actual);
        setView(toCalendar(actual));
      }
      lastDay = currentDay;
      setNow(actual);
    }
    update();
    const timer = setInterval(update, 1000);
    window.addEventListener("focus", update);
    return () => { clearInterval(timer); window.removeEventListener("focus", update); };
  }, [initialNow]);

  function select(date: Date) {
    followingToday.current = dayKey(date) === dayKey(new Date());
    setSelected(date);
    setView(toCalendar(date));
  }
  function today() {
    const date = new Date();
    setNow(date);
    select(date);
  }
  function navigate(delta: number) {
    followingToday.current = false;
    const next = shiftMonth(view.year, view.month, delta);
    setView({ ...next, day: 1 });
  }
  function openTool(tab: ToolTab) {
    setTool(tab);
    document.getElementById("tools")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <>
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:right-3 focus:z-50 focus:rounded-lg focus:bg-forest-deep focus:px-4 focus:py-3 focus:text-memorial-ink">رفتن به محتوای اصلی</a>
      <header className="border-b border-line bg-surface/80">
        <div className="mx-auto flex min-h-23 max-w-[1240px] flex-wrap items-center justify-between gap-4 px-5 py-4 sm:px-8">
          <a href="#" aria-label="تقویم، صفحهٔ اصلی" className="flex items-center gap-2.5 text-forest"><BrandMark /><span className="text-[1.6875rem] leading-none font-extrabold">تقویم<span className="mr-1 text-clay">.</span></span><span className="mr-4 hidden border-r border-line pr-5 text-xs font-normal text-muted xl:block">روزها را بهتر ببین</span></a>
          <nav aria-label="ناوبری اصلی" className="scrollbar-hidden order-3 flex w-full items-center justify-between gap-3 overflow-x-auto text-[0.6875rem] font-medium sm:order-none sm:w-auto sm:justify-start sm:gap-7 sm:text-xs">
            <a href="#calendar" className="flex shrink-0 items-center gap-1.5 text-forest"><CalendarDays size={16} />تقویم</a>
            <button onClick={() => openTool("convert")} className="flex shrink-0 items-center gap-1.5 text-muted hover:text-forest"><ArrowLeftRight size={16} />تبدیل تاریخ</button>
            <button onClick={() => openTool("distance")} className="flex shrink-0 items-center gap-1.5 text-muted hover:text-forest"><Hourglass size={16} />فاصلهٔ تاریخ‌ها</button>
            {preferences.religious && <a href="#prayer" className="flex shrink-0 items-center gap-1.5 text-muted hover:text-forest"><MapPin size={16} />اوقات شرعی</a>}
          </nav>
          <SettingsMenu />
        </div>
      </header>
      {/* On phones the month grid comes first and the hero follows it: measured in
          a sandbox, the first day cell sat at 1128px on a 664px screen, so the
          calendar was more than a screen down on the page people open to see a
          calendar. Desktop is untouched — `lg:block` restores normal flow, where
          `order` means nothing and the original margins apply again.
          Only the grid is ordered, and with `order-first` rather than a number:
          the tools, memorial and prayer panels take no className, so they keep
          the default order 0 — any positive number here would have put them
          above everything instead. */}
      <main id="main" className="mx-auto flex max-w-[1240px] flex-col px-4 pt-8 pb-10 sm:px-8 sm:pt-10 lg:block">
        <TodayPanel now={now} initialNow={initialNow} className="max-lg:mt-7" />
        <div className="order-first mt-7 grid items-stretch gap-5 max-lg:mt-0 lg:grid-cols-[1.7fr_1fr]">
          <CalendarPanel year={view.year} month={view.month} today={now} selected={selected} groups={preferences} memorial={preferences.memorial} onToggleView={toggleView} onSelect={select} onNavigate={navigate} onToday={today} onJump={(year, month) => { followingToday.current = false; setView({ year, month, day: 1 }); }} marked={dates.length > 0 ? (date) => datesOn(dates, date).length > 0 : undefined} />
          <EventsPanel year={view.year} month={view.month} selected={selected} groups={preferences} onSelect={select} />
        </div>
        <ToolsPanel now={now} tab={tool} onTabChange={setTool} groups={preferences} />
        {/* Memorial visibility is independent; religious occasions also control prayer times. */}
        {preferences.memorial && <MemorialPanel person={person} />}
        {preferences.religious && <PrayerPanel now={now} />}
      </main>
      <SiteFooter />
    </>
  );
}
