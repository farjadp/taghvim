// ============================================================================
// Source: src/components/sandbox-countdown.tsx
// Version: 0.1.0 — 2026-09-09
// Why: SANDBOX. Three ways of putting a countdown inside the real hero, each
//      rendered with the real TodayHero through its slots, each measured
//      against the hero without one, so the cost is a number.
// Env / Deps: lib/countdown over the real events. Delete this file and
//      src/app/sandbox/countdown/page.tsx to drop the sandbox; the slots on
//      TodayHero stay harmless and lib/countdown.ts stands alone.
// ============================================================================

"use client";

import { useEffect, useRef, useState } from "react";
import { Hourglass } from "lucide-react";
import { fa, formatDate } from "@/lib/calendar";
import { ALL_GROUPS, DEFAULT_GROUPS, type EventGroups } from "@/lib/events";
import { COUNTDOWN_NOTICE, nextAnchors, nextHolidays, type Occasion } from "@/lib/countdown";
import { TodayHero, type HeroSlots } from "./today-panel";

// «۶۶ روز تا …»: the number leads, the name follows, the way a countdown is read aloud.
const daysLabel = (item: Occasion) => item.days === 0 ? "امروز:" : item.days === 1 ? "فردا:" : `${fa(item.days)} روز تا`;

// الف · one quiet line under the date: the next holiday and Nowruz, nothing else.
function LineUnderDate({ holiday, nowruz }: { holiday?: Occasion; nowruz: Occasion }) {
  return (
    <p className="mt-2 text-xs leading-6 text-[#d9e3cf]">
      {holiday && <>{daysLabel(holiday)} {holiday.titles[0]}{holiday.uncertain && " (±۱)"}<span className="mx-2 opacity-50">·</span></>}
      {daysLabel(nowruz)} نوروز
    </p>
  );
}

// ب · a strip of chips under the clocks: the next three holidays and the nearest anchor.
function ChipsUnderClocks({ items }: { items: Occasion[] }) {
  return (
    <ul className="relative z-10 mt-4 flex flex-wrap gap-2" aria-label="روزشمار">
      {items.map((item) => (
        <li key={item.date.toISOString()} className="flex items-baseline gap-1.5 rounded-full border border-white/20 px-3 py-1.5 text-[0.6875rem] text-[#e2eadb]">
          <span className="text-sm font-medium tabular-nums">{item.days === 0 ? "امروز" : fa(item.days)}</span>
          {item.days > 0 && <span className="opacity-70">روز تا</span>}
          <span>{item.titles[0]}</span>
          {item.uncertain && <span className="opacity-60">±۱</span>}
        </li>
      ))}
    </ul>
  );
}

// ج · one big number under the clocks, the way the clock itself is big: the next holiday.
function BigUnderClocks({ item }: { item: Occasion }) {
  return (
    <div className="relative z-10 mt-5 flex flex-wrap items-end justify-between gap-4 border-t border-white/15 pt-4">
      <div className="flex items-center gap-3"><Hourglass size={19} className="text-[#d9e3cf]" /><span className="text-xs leading-6 text-[#d9e3cf]">تعطیلی بعدی<br />{item.titles[0]} · {formatDate(item.date)}{item.uncertain && " · ±۱ روز"}</span></div>
      <p className="text-[2.4rem] leading-none font-medium tabular-nums sm:text-5xl">{fa(item.days)}<span className="mr-2 text-base font-normal text-[#d9e3cf]">روز</span></p>
    </div>
  );
}

function Measured({ children, onHeight }: { children: React.ReactNode; onHeight: (value: number) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const report = useRef(onHeight);
  report.current = onHeight;
  // Re-measured after every render and on resize; ResizeObserver never fires in the headless
  // browser these numbers get read in.
  const measure = () => { if (ref.current) report.current(Math.round(ref.current.getBoundingClientRect().height)); };
  useEffect(measure);
  useEffect(() => { window.addEventListener("resize", measure); return () => window.removeEventListener("resize", measure); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  return <div ref={ref}>{children}</div>;
}

export function SandboxCountdown({ initialNow }: { initialNow: string }) {
  const now = new Date(initialNow);
  const [groups, setGroups] = useState<EventGroups>(DEFAULT_GROUPS);
  const [heights, setHeights] = useState<Record<string, number>>({});
  const anchors = nextAnchors(now);
  const nowruz = anchors.find((item) => item.titles[0] === "نوروز")!;
  const holidays = nextHolidays(now, groups, 3);
  const next = holidays[0];

  const variants: { key: string; title: string; note: string; slots?: HeroSlots }[] = [
    { key: "۰", title: "بدون روزشمار", note: "هیرو همان‌طور که هست؛ مبنای مقایسه.", slots: undefined },
    { key: "الف", title: "یک خط زیر تاریخ", note: "تعطیلی بعدی و نوروز، در یک خط کوچک. ارزان‌ترین، و کم‌دیده‌ترین.", slots: { underDate: <LineUnderDate holiday={next} nowruz={nowruz} /> } },
    { key: "ب", title: "چند نشان زیر ساعت", note: "سه تعطیلی بعدی و نزدیک‌ترین لنگر (یلدا یا نوروز) به‌شکل نشان. بیشترین اطلاعات، بیشترین قد.", slots: { underClocks: <ChipsUnderClocks items={[...holidays, anchors[0]].filter((item, index, all) => all.findIndex((other) => other.date.getTime() === item.date.getTime()) === index).slice(0, 4)} /> } },
    { key: "ج", title: "یک عدد بزرگ زیر ساعت", note: "فقط تعطیلی بعدی، به همان وزن ساعت. یک چیز، بزرگ.", slots: next ? { underClocks: <BigUnderClocks item={next} /> } : undefined },
  ];

  return (
    <div className="mx-auto max-w-[1240px] px-4 py-10 sm:px-8">
      <h1 className="text-sm font-semibold">سندباکس · روزشمار در هیرو</h1>
      <p className="mt-1 text-[0.6875rem] leading-5 text-muted">هر ستون هیروی واقعی است با یک جای درج متفاوت. قد هر کدام زیرش نوشته شده و با «بدون روزشمار» قابل مقایسه است. شمارش به روز است، نه به لحظه.</p>
      <div className="mt-3 flex gap-1">
        {([["پیش‌فرض", DEFAULT_GROUPS], ["همهٔ دسته‌ها", ALL_GROUPS]] as const).map(([label, value]) => (
          <button key={label} aria-pressed={groups === value} onClick={() => setGroups(value)} className={`rounded-lg px-3 py-1.5 text-[0.6875rem] ${groups === value ? "bg-leaf font-medium text-forest" : "text-muted hover:bg-paper"}`}>{label}</button>
        ))}
      </div>
      <div className="mt-6 grid items-start gap-6 lg:grid-cols-2">
        {variants.map(({ key, title, note, slots }) => (
          <section key={key} aria-label={`${key} · ${title}`}>
            <h2 className="mb-2 text-xs font-semibold">{key} · {title}</h2>
            <Measured onHeight={(value) => setHeights((current) => (current[key] === value ? current : { ...current, [key]: value }))}>
              <TodayHero now={now} initialNow={initialNow} slots={slots} />
            </Measured>
            <p className="mt-2 text-[0.625rem] leading-5 text-muted">{note}</p>
            <p data-testid={`height-${key}`} className="text-[0.625rem] text-clay">قد: {fa(heights[key] ?? 0)} پیکسل{key !== "۰" && heights["۰"] ? ` · ${fa((heights[key] ?? 0) - heights["۰"])}+ نسبت به بدون روزشمار` : ""}</p>
          </section>
        ))}
      </div>
      <p className="mt-6 text-[0.625rem] leading-5 text-muted">{COUNTDOWN_NOTICE}</p>
    </div>
  );
}
