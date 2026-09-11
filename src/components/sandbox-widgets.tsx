// ============================================================================
// Source: src/components/sandbox-widgets.tsx
// Version: 0.1.0 — 2026-09-10
// Why: SANDBOX. Three designs for each of the three widgets, each drawn at every
//      size the platforms actually hand a widget — from the official tables,
//      1 CSS px = 1 dp / 1 pt — and each frame measures itself after layout and
//      says whether its text fits or by how many pixels it is cut. Four sample
//      days: today, Nowruz, a plain Friday, and the day in the widget window
//      whose visible occasion title is longest, so the worst case is on screen.
//      Sizes are px here on purpose: a widget's box is fixed by the launcher,
//      not by the reader's font setting.
// Env / Deps: lib/calendar, lib/events. Throwaway.
// ============================================================================

"use client";

import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { addDays, fa, fromCalendar, MONTHS, toCalendar, WEEKDAYS, weekdayIndex } from "@/lib/calendar";
import { DEFAULT_GROUPS, eventsForDate, type CalendarEvent } from "@/lib/events";

type Day = {
  label: string;
  year: number;
  month: string;
  day: number;
  weekday: string;
  gregorian: string;
  events: CalendarEvent[];
  // A holiday, or Friday: both are drawn in clay, as on the site's grid.
  off: boolean;
  next: { title: string; days: number } | null;
};

const GREGORIAN_MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function describe(date: Date, label: string): Day {
  const p = toCalendar(date);
  const g = toCalendar(date, "gregorian");
  const w = weekdayIndex(date);
  const events = eventsForDate(date, DEFAULT_GROUPS);
  let next: Day["next"] = null;
  // A full year ahead: with the default groups the next holiday is usually
  // Nowruz, which from Shahrivar is ~190 days away.
  for (let i = 1; i <= 366 && !next; i += 1) {
    const holiday = eventsForDate(addDays(date, i), DEFAULT_GROUPS).find((event) => event.holiday);
    if (holiday) next = { title: holiday.title, days: i };
  }
  return {
    label,
    year: p.year,
    month: MONTHS[p.month - 1],
    day: p.day,
    weekday: WEEKDAYS[w],
    gregorian: `${g.day} ${GREGORIAN_MONTHS[g.month - 1]} ${g.year}`,
    events,
    off: w === 6 || events.some((event) => event.holiday),
    next,
  };
}

// The day in 1405–1406 whose first visible title is longest: the worst case.
function longestDay(): Date {
  let best = fromCalendar({ year: 1405, month: 1, day: 1 });
  let length = 0;
  const end = fromCalendar({ year: 1407, month: 1, day: 1 });
  for (let date = best; date < end; date = addDays(date, 1)) {
    const title = eventsForDate(date, DEFAULT_GROUPS)[0]?.title ?? "";
    if (title.length > length) {
      length = title.length;
      best = date;
    }
  }
  return best;
}

function firstFriday(from: Date): Date {
  let date = from;
  while (weekdayIndex(date) !== 6 || eventsForDate(date, DEFAULT_GROUPS).length > 0) date = addDays(date, 1);
  return date;
}

// ---------------------------------------------------------------------------
// Frames: an official size, and a measurement of what did not fit.

type Size = { label: string; box: string; shape: "tall" | "strip" | "square" | "lock" | "inline" };

const SMALL_SIZES: Size[] = [
  { label: "اندروید ۱×۱ عمودی · 57×102", box: "w-[57px] h-[102px]", shape: "tall" },
  { label: "اندروید ۱×۱ افقی · 127×51", box: "w-[127px] h-[51px]", shape: "strip" },
  { label: "آیفون کوچک · 158×158", box: "w-[158px] h-[158px]", shape: "square" },
  { label: "آیفون کوچک · 170×170", box: "w-[170px] h-[170px]", shape: "square" },
];
const WIDE_SIZES: Size[] = [
  { label: "اندروید ۴×۱ عمودی · 276×102", box: "w-[276px] h-[102px]", shape: "tall" },
  { label: "اندروید ۴×۱ افقی · 554×51", box: "w-[554px] h-[51px]", shape: "strip" },
];
const LOCK_SIZES: Size[] = [
  { label: "مستطیلی · 160×72", box: "w-[160px] h-[72px]", shape: "lock" },
  { label: "مستطیلی · 172×76", box: "w-[172px] h-[76px]", shape: "lock" },
  { label: "یک‌خطی بالای ساعت · 234×26", box: "w-[234px] h-[26px]", shape: "inline" },
];

// Two different things, measured separately:
//   outside   how far any text box reaches past the frame's edge — clipped by the
//             launcher, a real defect. Line boxes, not glyph ink, so a numeral
//             set `leading-none` does not count against itself.
//   shortened how many text elements the design itself cut with an ellipsis or
//             a line clamp — a choice, but one the reader should see.
type Fit = { outside: number; shortened: number };

function measure(root: HTMLElement): Fit {
  const frame = root.getBoundingClientRect();
  let outside = 0;
  let shortened = 0;
  for (const el of Array.from(root.querySelectorAll<HTMLElement>("*"))) {
    const box = el.getBoundingClientRect();
    if (box.width === 0 && box.height === 0) continue;
    outside = Math.max(outside, frame.left - box.left, box.right - frame.right, frame.top - box.top, box.bottom - frame.bottom);
    const style = getComputedStyle(el);
    const clips = style.textOverflow === "ellipsis" || style.webkitLineClamp !== "none";
    if (clips && (el.scrollWidth > el.clientWidth + 1 || el.scrollHeight > el.clientHeight + 1)) shortened += 1;
  }
  return { outside: Math.round(outside), shortened };
}

function Frame({ size, dark, children }: { size: Size; dark?: boolean; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [fit, setFit] = useState<Fit | null>(null);
  useLayoutEffect(() => {
    if (!ref.current) return;
    const next = measure(ref.current);
    setFit((prev) => (prev && prev.outside === next.outside && prev.shortened === next.shortened ? prev : next));
  });
  return (
    <figure className="flex flex-col items-start gap-1.5">
      <div
        ref={ref}
        className={`${size.box} overflow-hidden ${
          size.shape === "inline" ? "" : size.shape === "lock" ? "rounded-2xl" : "rounded-[16px] shadow-md shadow-black/15"
        } ${dark ? "text-white" : "bg-surface text-ink"}`}
      >
        {children}
      </div>
      <figcaption className={`text-[0.6875rem] ${dark ? "text-white/80" : "text-muted"}`}>
        <span dir="ltr" className="[unicode-bidi:isolate]">{size.label}</span>
        {fit !== null && (
          <span data-fit={fit.outside > 0 ? "outside" : fit.shortened > 0 ? "shortened" : "fits"} className={`ms-2 font-medium ${fit.outside > 0 ? (dark ? "text-holiday" : "text-clay") : dark ? "text-white" : "text-forest"}`}>
            {fit.outside > 0 ? `بیرون از قاب: ${fa(fit.outside)}px` : "جا می‌شود"}
            {fit.shortened > 0 && <span className={dark ? "text-white/80" : "text-muted"}> · {fa(fit.shortened)} متن کوتاه شد</span>}
          </span>
        )}
      </figcaption>
    </figure>
  );
}

// ---------------------------------------------------------------------------
// Small (1×1 on Android, small on iPhone).

const numeral = (d: Day) => (d.off ? "text-clay" : "text-forest");

function SmallA({ d, shape }: { d: Day; shape: Size["shape"] }) {
  if (shape === "strip") {
    return (
      <div className="flex h-full items-center justify-center gap-2 px-2">
        <span className={`text-[26px] leading-none font-extrabold ${numeral(d)}`}>{fa(d.day)}</span>
        <span className="text-[12px] leading-tight font-medium">{d.month}</span>
      </div>
    );
  }
  const big = shape === "square";
  return (
    <div className="flex h-full flex-col items-center justify-center">
      <span className={`${big ? "text-[64px]" : "text-[30px]"} leading-none font-extrabold ${numeral(d)}`}>{fa(d.day)}</span>
      <span className={`${big ? "mt-2 text-[17px]" : "mt-1 text-[11px]"} font-medium`}>{d.month}</span>
      <span className={`${big ? "text-[13px]" : "text-[9px]"} text-muted`}>{fa(d.year)}</span>
    </div>
  );
}

function SmallB({ d, shape }: { d: Day; shape: Size["shape"] }) {
  if (shape === "strip") {
    return (
      <div className="flex h-full flex-col justify-center px-3">
        <span className="text-[10px] text-muted">{d.weekday}</span>
        <span className="text-[16px] leading-tight font-bold">
          <span className={numeral(d)}>{fa(d.day)}</span> {d.month}
        </span>
      </div>
    );
  }
  const big = shape === "square";
  return (
    <div className="flex h-full flex-col items-center justify-center">
      <span className={`${big ? "text-[14px]" : "text-[9px]"} text-muted`}>{d.weekday}</span>
      <span className={`${big ? "text-[60px]" : "text-[28px]"} leading-tight font-extrabold ${numeral(d)}`}>{fa(d.day)}</span>
      <span className={`${big ? "text-[16px]" : "text-[11px]"} font-medium`}>{d.month}</span>
    </div>
  );
}

function SmallC({ d, shape }: { d: Day; shape: Size["shape"] }) {
  const first = d.events[0];
  const mark = first ? (first.holiday ? "bg-clay" : "bg-forest") : "bg-transparent";
  if (shape === "strip") {
    return (
      <div className="flex h-full items-center gap-2 px-3">
        <span className={`text-[26px] leading-none font-extrabold ${numeral(d)}`}>{fa(d.day)}</span>
        <span className="min-w-0 flex-1">
          <span className="block text-[12px] font-medium">{d.month}</span>
          <span className={`mt-1 block h-[3px] w-6 rounded-full ${mark}`} />
        </span>
      </div>
    );
  }
  const big = shape === "square";
  return (
    <div className={`flex h-full flex-col ${big ? "justify-between p-4" : "items-center justify-center"}`}>
      <div className={big ? "" : "flex flex-col items-center"}>
        <span className={`${big ? "text-[56px]" : "text-[30px]"} block leading-none font-extrabold ${numeral(d)}`}>{fa(d.day)}</span>
        <span className={`${big ? "mt-1 text-[16px]" : "mt-1 text-[11px]"} block font-medium`}>{d.month}</span>
      </div>
      {big && first ? (
        <span className={`line-clamp-2 text-[12px] leading-snug ${first.holiday ? "text-clay" : "text-muted"}`}>{first.title}</span>
      ) : (
        <span className={`${big ? "" : "mt-2"} block h-[3px] w-5 rounded-full ${mark}`} />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Wide (4×1, Android).

function WideA({ d, shape }: { d: Day; shape: Size["shape"] }) {
  const first = d.events[0];
  const pill = first && (
    <span className={`max-w-[45%] shrink-0 truncate rounded-full px-3 py-1 text-[11px] font-medium ${first.holiday ? "bg-holiday text-clay" : "bg-paper text-forest"}`}>
      {first.title}
    </span>
  );
  if (shape === "strip") {
    return (
      <div className="flex h-full items-center justify-between gap-3 px-4">
        <span className="text-[16px] font-bold">
          {d.weekday} {fa(d.day)} {d.month} {fa(d.year)}
        </span>
        {pill}
      </div>
    );
  }
  return (
    <div className="flex h-full items-center justify-between gap-3 px-4">
      <div className="min-w-0">
        <p className="text-[11px] text-muted">{d.weekday}</p>
        <p className="text-[18px] leading-tight font-bold">
          {fa(d.day)} {d.month} {fa(d.year)}
        </p>
        <p className="text-[10px] text-muted" dir="ltr">{d.gregorian}</p>
      </div>
      {pill}
    </div>
  );
}

function WideB({ d, shape }: { d: Day; shape: Size["shape"] }) {
  const first = d.events[0];
  const strip = shape === "strip";
  return (
    <div className="flex h-full items-stretch">
      <div className={`flex ${strip ? "w-[52px]" : "w-[72px]"} shrink-0 flex-col items-center justify-center ${d.off ? "bg-clay" : "bg-forest"} text-white`}>
        <span className={`${strip ? "text-[24px]" : "text-[34px]"} leading-none font-extrabold`}>{fa(d.day)}</span>
        {!strip && <span className="mt-1 text-[11px]">{d.month}</span>}
      </div>
      <div className={`flex min-w-0 flex-1 ${strip ? "items-center gap-3" : "flex-col justify-center"} px-3`}>
        <p className="shrink-0 text-[13px] font-bold">
          {d.weekday}{strip ? ` ${d.month}` : ""} {fa(d.year)}
        </p>
        <p className={`truncate text-[11px] ${first?.holiday ? "text-clay" : "text-muted"}`}>
          {first ? first.title : <span dir="ltr">{d.gregorian}</span>}
        </p>
      </div>
    </div>
  );
}

function WideC({ d, shape }: { d: Day; shape: Size["shape"] }) {
  const first = d.events[0];
  const line = first
    ? <span className={first.holiday ? "text-clay" : "text-forest"}>{first.title}</span>
    : d.next
      ? <span className="text-muted">{fa(d.next.days)} روز تا {d.next.title}</span>
      : null;
  if (shape === "strip") {
    return (
      <div className="flex h-full items-center gap-4 px-4">
        <span className="shrink-0 text-[16px] font-bold">
          {d.weekday} {fa(d.day)} {d.month}
        </span>
        <span className="min-w-0 truncate text-[12px]">{line}</span>
      </div>
    );
  }
  return (
    <div className="flex h-full flex-col justify-center gap-1 px-4">
      <p className="text-[18px] leading-tight font-bold">
        {d.weekday} <span className={numeral(d)}>{fa(d.day)}</span> {d.month}
      </p>
      <p className="truncate text-[12px]">{line}</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Lock screen (iPhone). Monochrome: iOS tints lock-screen widgets itself.

function LockA({ d, shape }: { d: Day; shape: Size["shape"] }) {
  if (shape === "inline") return <p className="truncate text-[13px] leading-[26px]">{d.weekday} {fa(d.day)} {d.month}</p>;
  const first = d.events[0];
  return (
    <div className="flex h-full flex-col justify-center gap-0.5 px-1">
      <p className="text-[15px] font-bold">{d.weekday} {fa(d.day)} {d.month}</p>
      <p className="truncate text-[12px] opacity-80">{first ? first.title : fa(d.year)}</p>
    </div>
  );
}

function LockB({ d, shape }: { d: Day; shape: Size["shape"] }) {
  const first = d.events[0];
  if (shape === "inline") {
    return <p className="truncate text-[13px] leading-[26px]">{fa(d.day)} {d.month}{first ? ` · ${first.title}` : ""}</p>;
  }
  return (
    <div className="flex h-full flex-col justify-center px-1">
      <p className="text-[11px] opacity-80">{d.weekday}</p>
      <p className="text-[20px] leading-tight font-bold">{fa(d.day)} {d.month}</p>
      {first && <p className="truncate text-[11px] opacity-80">{first.title}</p>}
    </div>
  );
}

function LockC({ d, shape }: { d: Day; shape: Size["shape"] }) {
  if (shape === "inline") return <p className="truncate text-[13px] leading-[26px]">{fa(d.day)} {d.month} {fa(d.year)}</p>;
  const first = d.events[0];
  return (
    <div className="flex h-full items-center gap-2.5 rounded-2xl bg-white/15 px-2.5">
      <span className="text-[30px] leading-none font-extrabold">{fa(d.day)}</span>
      <span className="min-w-0 flex-1">
        <span className="block text-[13px] font-bold">{d.month} {fa(d.year)}</span>
        <span className="block truncate text-[11px] opacity-80">{first ? first.title : d.weekday}</span>
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------

type Variant = { id: string; name: string; note: string; View: (props: { d: Day; shape: Size["shape"] }) => ReactNode };

const GROUPS: { title: string; sizes: Size[]; dark?: boolean; variants: Variant[] }[] = [
  {
    title: "کوچک — اندروید و آیفون",
    sizes: SMALL_SIZES,
    variants: [
      { id: "A", name: "عدد، ماه، سال", note: "همان طرحی که حالا در /download کشیده شده.", View: SmallA },
      { id: "B", name: "روز هفته بالا", note: "سال حذف می‌شود و روز هفته جایش را می‌گیرد.", View: SmallB },
      { id: "C", name: "نشانهٔ مناسبت", note: "خط کوچک رنگی وقتی روز مناسبت دارد؛ در اندازهٔ آیفون عنوان مناسبت هم می‌آید.", View: SmallC },
    ],
  },
  {
    title: "پهن — اندروید",
    sizes: WIDE_SIZES,
    variants: [
      { id: "A", name: "تاریخ و برچسب مناسبت", note: "همان طرح /download.", View: WideA },
      { id: "B", name: "بلوک عدد", note: "عدد روز در یک مربع سبز؛ روز تعطیل سفالی.", View: WideB },
      { id: "C", name: "تا تعطیلی بعدی", note: "روزی که مناسبت ندارد، شمار روزها تا تعطیلی بعدی را نشان می‌دهد.", View: WideC },
    ],
  },
  {
    title: "صفحهٔ قفل — آیفون",
    sizes: LOCK_SIZES,
    dark: true,
    variants: [
      { id: "A", name: "دو خط", note: "همان طرح /download، بدون ساعت که مال خود سیستم است.", View: LockA },
      { id: "B", name: "تاریخ درشت", note: "روز هفته کوچک بالا، تاریخ درشت، مناسبت زیرش.", View: LockB },
      { id: "C", name: "عدد و کادر", note: "عدد روز کنار ماه و سال، در کادر نیمه‌شفاف.", View: LockC },
    ],
  },
];

export function SandboxWidgets({ initialNow }: { initialNow: string }) {
  const [days] = useState(() => {
    const today = new Date(initialNow);
    return [
      describe(today, "امروز"),
      describe(fromCalendar({ year: 1406, month: 1, day: 1 }), "نوروز ۱۴۰۶"),
      // From tomorrow, so the sample never repeats «today» when today is a Friday.
      describe(firstFriday(addDays(today, 1)), "جمعهٔ بی‌مناسبت"),
      describe(longestDay(), "بلندترین عنوان"),
    ];
  });
  const [pick, setPick] = useState(0);
  const d = days[pick];

  return (
    <main className="mx-auto max-w-6xl px-5 py-10">
      <h1 className="text-2xl font-bold">سندباکس ویجت‌ها</h1>
      <p className="mt-2 max-w-3xl text-sm text-muted">
        هر طرح در همهٔ اندازه‌هایی کشیده شده که سیستم واقعاً به ویجت می‌دهد (جدول رسمی اندروید و اپل، یک پیکسل برابر یک dp یا pt).
        زیر هر قاب اندازه‌گیری خود صفحه است: «جا می‌شود» یا چند پیکسل از متن بریده شده.
      </p>
      <p className="mt-2 max-w-3xl text-sm text-clay">
        قلم: اندروید قلم سفارشی را در ویجت رسماً پشتیبانی نمی‌کند. این‌جا همه با قلم سایت کشیده شده‌اند؛ در اندروید یا قلم سیستم است یا متن به‌صورت تصویر کشیده می‌شود.
      </p>

      <div className="mt-6 flex flex-wrap gap-2" role="group" aria-label="روز نمونه">
        {days.map((day, index) => (
          <button
            key={day.label}
            type="button"
            onClick={() => setPick(index)}
            aria-pressed={pick === index}
            className={`rounded-full border px-4 py-1.5 text-sm ${pick === index ? "border-forest bg-forest text-white" : "border-line bg-surface"}`}
          >
            {day.label} · {fa(day.day)} {day.month}
          </button>
        ))}
      </div>

      {GROUPS.map((group) => (
        <section key={group.title} className="mt-12">
          <h2 className="text-lg font-bold">{group.title}</h2>
          {group.variants.map(({ id, name, note, View }) => (
            <div key={id} className="mt-6 rounded-2xl border border-line p-5">
              <p className="font-medium">
                <span className="text-forest">{id}</span> · {name}
              </p>
              <p className="mt-1 text-xs text-muted">{note}</p>
              <div className={`mt-4 flex flex-wrap items-start gap-6 overflow-x-auto rounded-xl p-4 ${group.dark ? "bg-forest-deep" : "bg-paper"}`}>
                {group.sizes.map((size) => (
                  <Frame key={size.label} size={size} dark={group.dark}>
                    <View d={d} shape={size.shape} />
                  </Frame>
                ))}
              </div>
            </div>
          ))}
        </section>
      ))}
    </main>
  );
}
