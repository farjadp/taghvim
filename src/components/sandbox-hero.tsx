// ============================================================================
// Source: src/components/sandbox-hero.tsx
// Version: 0.7.1-sandbox — 2026-09-07
// Why: SANDBOX. Four renderings of the same top row, so the empty space under
//      the Tehran clock can be judged by eye and by measured height:
//      the current build, then three fixes. Measurements are live.
// Env / Deps: lib/calendar, lib/clocks, components/world-clocks (reused as-is
//      so the side card is the real one). Not imported by any live page.
// ============================================================================

"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowDownLeft, Clock3, Copy } from "lucide-react";
import { MONTHS, dateNumbers, fa, formatDate, toCalendar } from "@/lib/calendar";
import { TEHRAN, dayShift, deviceZone, matchesTehran, offsetFromTehran, timeIn, zoneLabel } from "@/lib/clocks";
import { WorldClocks } from "./world-clocks";

function useNow(initialNow: string) {
  const [now, setNow] = useState(() => new Date(initialNow));
  useEffect(() => {
    setNow(new Date());
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  return now;
}

// Copy of the hero illustration from today-panel.tsx. Duplicated on purpose:
// the sandbox must not make the shipped component export anything new.
function SunDrawing() {
  return (
    <svg viewBox="0 0 250 240" fill="none" aria-hidden="true" className="pointer-events-none absolute -bottom-10 left-2 h-64 w-64 text-[#b7c7a6] opacity-35 sm:left-8">
      <path d="M30 232V121a95 95 0 0 1 190 0v111M43 232V121a82 82 0 0 1 164 0v111M56 232V121a69 69 0 0 1 138 0v111" stroke="currentColor" strokeWidth=".8" />
      <circle cx="125" cy="120" r="30" stroke="currentColor" />
      <circle cx="125" cy="120" r="24" stroke="currentColor" strokeDasharray="1 4" />
      {Array.from({ length: 16 }, (_, i) => <path key={i} d="M125 78v-12m-3 8 3 4 3-4" stroke="currentColor" strokeWidth=".8" transform={`rotate(${i * 22.5} 125 120)`} />)}
      <path d="M18 176h214M18 185h214M18 194h214M80 219l45-19 45 19m-77 6 32-14 32 14" stroke="currentColor" strokeWidth=".8" />
    </svg>
  );
}

// `bottomAligned` turns the hero into a column that pushes the clock row to the
// floor, so extra height lands above the clock instead of under it.
function Hero({ now, bottomAligned, children }: { now: Date; bottomAligned?: boolean; children?: React.ReactNode }) {
  const persian = toCalendar(now);
  const clock = new Intl.DateTimeFormat("fa-IR", { timeZone: TEHRAN, hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }).format(now);
  return (
    <div className={`relative isolate overflow-hidden rounded-[1.75rem] bg-forest-deep px-7 py-7 text-white sm:px-9 ${bottomAligned ? "flex flex-col" : ""}`}>
      <SunDrawing />
      <div className="relative z-10 flex flex-wrap items-start justify-between gap-5">
        <div>
          <div className="mb-3 flex items-center gap-2 text-sm text-[#d9e3cf]"><span className="size-1.5 rounded-full bg-[#c8d4a8]" />امروز، {new Intl.DateTimeFormat("fa-IR", { weekday: "long", timeZone: TEHRAN }).format(now)}</div>
          <h3 className="text-3xl leading-normal font-semibold sm:text-[2.7rem]">{fa(persian.day)} {MONTHS[persian.month - 1]} <span className="font-normal text-[#d9e3cf]">{fa(persian.year)}</span></h3>
        </div>
        <span className="flex size-10 items-center justify-center rounded-full border border-white/25 text-[#e2eadb]"><Copy size={17} /></span>
      </div>
      <div className={`relative z-10 flex flex-wrap items-end justify-between gap-4 ${bottomAligned ? "mt-auto pt-8" : "mt-8"}`}>
        <div className="flex items-center gap-3"><Clock3 size={19} className="text-[#d9e3cf]" /><span className="text-xs leading-6 text-[#d9e3cf]">ساعت ایران<br />تهران · UTC +۳:۳۰</span></div>
        <time className="text-[2.4rem] leading-none font-medium tracking-wide tabular-nums sm:text-5xl" dir="ltr">{clock}</time>
      </div>
      {children}
      <p className="relative z-10 mt-3 min-h-4 text-[0.625rem] text-[#d9e3cf]">بر پایهٔ ساعت دستگاه شما</p>
    </div>
  );
}

// The real side card, minus the clocks unless `withClocks` is set.
function SideCard({ now, withClocks }: { now: Date; withClocks: boolean }) {
  return (
    <div className="flex flex-col justify-between rounded-[1.75rem] border border-line bg-surface p-6 sm:p-7">
      <div className="flex items-center justify-between"><h3 className="text-base font-semibold">امروز در تقویم‌های دیگر</h3><ArrowDownLeft size={19} className="text-muted" /></div>
      <div className="mt-5 border-b border-line pb-5"><div className="flex items-center justify-between text-xs text-muted"><span>میلادی</span><span dir="ltr">GREGORIAN</span></div><p className="mt-3 text-xl font-medium tabular-nums" dir="ltr">{dateNumbers(now, "gregorian")}</p><p className="mt-1 text-xs text-muted" dir="ltr">{formatDate(now, "gregorian", true)}</p></div>
      <div className={withClocks ? "py-4" : "pt-4"}><div className="flex items-center justify-between text-xs text-muted"><span>هجری قمری</span><span dir="ltr">HIJRI</span></div><p className="mt-2 text-lg font-medium">{formatDate(now, "islamic")}</p><p className="mt-1 text-[0.625rem] text-muted">محاسباتی؛ ممکن است با تقویم رسمی یک روز اختلاف داشته باشد.</p></div>
      {withClocks && <WorldClocks now={now} />}
    </div>
  );
}

// A quiet clock line for inside the hero, in the hero's own colours.
function HeroClock({ now, timeZone, label }: { now: Date; timeZone: string; label: string }) {
  const shift = dayShift(now, timeZone);
  return (
    <div className="flex items-center justify-between gap-3 text-[#d9e3cf]">
      <span className="flex min-w-0 items-baseline gap-1.5">
        <span className="truncate text-xs">{label}</span>
        <span className="shrink-0 text-[0.625rem] opacity-75">{offsetFromTehran(now, timeZone)}</span>
      </span>
      <span className="flex shrink-0 items-center gap-2">
        {shift && <span className="rounded bg-white/10 px-1.5 py-0.5 text-[0.625rem]">{shift}</span>}
        <time className="text-base font-medium tabular-nums text-white" dir="ltr">{timeIn(now, timeZone)}</time>
      </span>
    </div>
  );
}

// Measures the two cards of a row and reports the gap the hero has to absorb.
function Measured({ title, note, verdict, tone, children }: { title: string; note: string; verdict: string; tone: "bad" | "good"; children: React.ReactNode }) {
  const box = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<{ hero: number; card: number } | null>(null);
  useEffect(() => {
    function measure() {
      const hero = box.current?.querySelector<HTMLElement>(".bg-forest-deep");
      const card = box.current?.querySelector<HTMLElement>(".bg-surface");
      if (hero && card) setSize({ hero: Math.round(hero.getBoundingClientRect().height), card: Math.round(card.getBoundingClientRect().height) });
    }
    measure();
    window.addEventListener("resize", measure);
    const timer = setInterval(measure, 1000);
    return () => { window.removeEventListener("resize", measure); clearInterval(timer); };
  }, []);
  return (
    <section className="rounded-2xl border border-line bg-surface p-5 sm:p-6">
      <h2 className="text-base font-semibold text-ink">{title}</h2>
      <p className="mt-1.5 text-xs leading-6 text-muted">{note}</p>
      <div ref={box} className="mt-5">{children}</div>
      <p className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-line pt-4 text-[0.6875rem] text-muted">
        <span>کارت سبز <span className="tabular-nums text-ink">{size ? fa(size.hero) : "…"}</span> پیکسل</span>
        <span>کارت سفید <span className="tabular-nums text-ink">{size ? fa(size.card) : "…"}</span> پیکسل</span>
      </p>
      <p className={`mt-2 text-xs leading-6 ${tone === "bad" ? "text-clay" : "text-forest"}`}>{verdict}</p>
    </section>
  );
}

export function HeroSandbox({ initialNow }: { initialNow: string }) {
  const now = useNow(initialNow);
  const [device, setDevice] = useState<string | null>(null);
  useEffect(() => { setDevice(deviceZone()); }, []);
  const showDevice = device !== null && !matchesTehran(now, device);

  return (
    <div className="space-y-6">
      <Measured
        title="امروز · ساخت فعلی"
        note="ساعت‌ها در کارت سفید. کارت سفید بلندتر می‌شود و گرید کارت سبز را تا همان قد می‌کشد؛ ارتفاع اضافه زیر ساعت جمع می‌شود."
        tone="bad"
        verdict="همان چیزی که به آن ایراد گرفتی."
      >
        <div className="grid gap-5 lg:grid-cols-[1.7fr_1fr]">
          <Hero now={now} />
          <SideCard now={now} withClocks />
        </div>
      </Measured>

      <Measured
        title="الف · ساعت بچسبد به کف کارت"
        note="کارت سبز ستون می‌شود و ردیف ساعت به کف می‌چسبد. قدها عوض نمی‌شوند، ولی فضای اضافه می‌رود بالای ساعت، جایی که تاریخ و ساعت را از هم باز می‌کند، نه زیر ساعت."
        tone="good"
        verdict="کم‌ترین تغییر. فضای خالی از بین نمی‌رود، فقط جایش عوض می‌شود و دیگر شبیه دنبالهٔ رهاشده نیست."
      >
        <div className="grid gap-5 lg:grid-cols-[1.7fr_1fr]">
          <Hero now={now} bottomAligned />
          <SideCard now={now} withClocks />
        </div>
      </Measured>

      <Measured
        title="ب · ساعت‌ها بروند داخل همان فضای خالی"
        note="ساعت‌ها از کارت سفید درمی‌آیند و می‌روند پایین کارت سبز، دقیقاً در فضایی که الان خالی است. کارت سفید به قد قبلی‌اش برمی‌گردد."
        tone="good"
        verdict="فضای خالی نه جابه‌جا، بلکه پر می‌شود؛ و کارت سفید دست‌نخورده می‌ماند. در عوض ساعت‌ها می‌روند روی کارت اصلی."
      >
        <div className="grid gap-5 lg:grid-cols-[1.7fr_1fr]">
          <Hero now={now}>
            {showDevice && (
              <div className="relative z-10 mt-5 space-y-2.5 border-t border-white/15 pt-4">
                <HeroClock now={now} timeZone={device!} label={`${zoneLabel(device!)} (شما)`} />
              </div>
            )}
          </Hero>
          <SideCard now={now} withClocks={false} />
        </div>
      </Measured>

      <Measured
        title="پ · دو کارت هم‌قد نباشند"
        note="یک کلمه در گرید عوض می‌شود و هر کارت به قد طبیعی خودش درمی‌آید. کارت سبز هیچ فضای خالی ندارد."
        tone="bad"
        verdict="فضای خالی صفر می‌شود، ولی کف دو کارت هم‌تراز نیست. به نظر من این از فضای خالی بدتر است."
      >
        <div className="grid items-start gap-5 lg:grid-cols-[1.7fr_1fr]">
          <Hero now={now} />
          <SideCard now={now} withClocks />
        </div>
      </Measured>
    </div>
  );
}
