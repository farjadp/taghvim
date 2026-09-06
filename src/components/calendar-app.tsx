"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ArrowLeftRight, CalendarDays, Hourglass, MapPin, ArrowUpLeft } from "lucide-react";
import { dayKey, shiftMonth, toCalendar } from "@/lib/calendar";
import { TodayPanel } from "./today-panel";
import { CalendarPanel } from "./calendar-panel";
import { EventsPanel } from "./events-panel";
import { ToolsPanel, type ToolTab } from "./tools-panel";
import { PrayerPanel } from "./prayer-panel";
import { SiteFooter } from "./site-footer";

function BrandMark() {
  return <Image src="/icon.svg" width={40} height={40} alt="" unoptimized className="size-10 shrink-0" />;
}

export function CalendarApp({ initialNow }: { initialNow: string }) {
  const [now, setNow] = useState(new Date(initialNow));
  const [selected, setSelected] = useState(new Date(initialNow));
  const [view, setView] = useState(() => toCalendar(new Date(initialNow)));
  const [tool, setTool] = useState<ToolTab>("convert");
  const followingToday = useRef(true);
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
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:right-3 focus:z-50 focus:rounded-lg focus:bg-forest focus:px-4 focus:py-3 focus:text-white">رفتن به محتوای اصلی</a>
      <header className="border-b border-line bg-white/80">
        <div className="mx-auto flex min-h-23 max-w-[1240px] flex-wrap items-center justify-between gap-4 px-5 py-4 sm:px-8">
          <a href="#" aria-label="تقویم، صفحهٔ اصلی" className="flex items-center gap-2.5 text-forest"><BrandMark /><span className="text-[27px] leading-none font-extrabold">تقویم<span className="mr-1 text-clay">.</span></span><span className="mr-4 hidden border-r border-line pr-5 text-xs font-normal text-muted xl:block">روزها را بهتر ببین</span></a>
          <nav aria-label="ناوبری اصلی" className="order-3 flex w-full items-center justify-between gap-3 overflow-x-auto text-[11px] font-medium sm:order-none sm:w-auto sm:justify-start sm:gap-7 sm:text-xs">
            <a href="#calendar" className="flex shrink-0 items-center gap-1.5 text-forest"><CalendarDays size={16} />تقویم</a>
            <button onClick={() => openTool("convert")} className="flex shrink-0 items-center gap-1.5 text-muted hover:text-forest"><ArrowLeftRight size={16} />تبدیل تاریخ</button>
            <button onClick={() => openTool("distance")} className="flex shrink-0 items-center gap-1.5 text-muted hover:text-forest"><Hourglass size={16} />فاصلهٔ تاریخ‌ها</button>
            <a href="#prayer" className="flex shrink-0 items-center gap-1.5 text-muted hover:text-forest"><MapPin size={16} />اوقات شرعی</a>
          </nav>
          <span className="rounded-full border border-line px-3 py-1.5 text-[10px] text-muted">ساده، برای هر روز</span>
        </div>
      </header>
      <main id="main" className="mx-auto max-w-[1240px] px-4 pt-8 pb-10 sm:px-8 sm:pt-10">
        <div className="mb-6 flex items-end justify-between"><div><h2 className="text-xl font-semibold sm:text-2xl">امروزت به‌خیر.</h2><p className="mt-1.5 text-xs text-muted">زمان، تاریخ و روزهایی که پیش رو داریم.</p></div><span className="hidden items-center gap-2 text-[11px] text-muted sm:flex"><span className="size-1.5 rounded-full bg-forest" />به وقت ایران</span></div>
        <TodayPanel now={now} initialNow={initialNow} />
        <div className="mt-7 grid items-stretch gap-5 lg:grid-cols-[1.7fr_1fr]">
          <CalendarPanel year={view.year} month={view.month} today={now} selected={selected} onSelect={select} onNavigate={navigate} onToday={today} onJump={(year, month) => { followingToday.current = false; setView({ year, month, day: 1 }); }} />
          <EventsPanel year={view.year} month={view.month} selected={selected} onSelect={select} />
        </div>
        <ToolsPanel now={now} tab={tool} onTabChange={setTool} />
        <PrayerPanel now={now} />
        <section className="mt-7 flex flex-col justify-between gap-4 rounded-2xl bg-sand px-6 py-5 sm:flex-row sm:items-center"><div><h2 className="text-sm font-semibold">یک تقویم، بدون حواس‌پرتی.</h2><p className="mt-1.5 text-xs leading-6 text-muted">بدون ثبت‌نام. بدون تبلیغات. برای پیدا کردن روزها و برنامه‌ریزی لحظه‌ها.</p></div><a href="#calendar" className="flex shrink-0 items-center gap-2 text-xs font-medium text-forest">برگردیم به روزها<ArrowUpLeft size={16} /></a></section>
      </main>
      <SiteFooter />
    </>
  );
}
