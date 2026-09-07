// ============================================================================
// Source: src/components/sandbox-hero.tsx
// Version: 0.8.0-sandbox — 2026-09-07
// Why: SANDBOX for the chosen layout (J): world clocks in the hero, and the
//      zodiac appended to the side card under the other two calendars. What
//      is still open is how the sign is drawn, so three treatments are shown
//      plus every glyph at once. Heights are measured live.
// Env / Deps: lib/calendar, lib/clocks, lib/zodiac, components/zodiac-icon,
//      components/world-clocks (the real one). No live page imports this.
// ============================================================================

"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowDownLeft, Clock3, Copy } from "lucide-react";
import { MONTHS, dateNumbers, fa, formatDate, toCalendar } from "@/lib/calendar";
import { TEHRAN, dayShift, deviceZone, matchesTehran, offsetFromTehran, timeIn, zoneLabel } from "@/lib/clocks";
import { SIGNS, ZODIAC_NOTICE, signFor, signRange } from "@/lib/zodiac";
import { ZodiacIcon } from "./zodiac-icon";

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

// Layout J's hero: unchanged, plus the visitor's own clock in the space that
// would otherwise be empty.
function Hero({ now }: { now: Date }) {
  const persian = toCalendar(now);
  const [device, setDevice] = useState<string | null>(null);
  useEffect(() => { setDevice(deviceZone()); }, []);
  const showDevice = device !== null && !matchesTehran(now, device);
  const clock = new Intl.DateTimeFormat("fa-IR", { timeZone: TEHRAN, hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }).format(now);
  return (
    <div className="relative isolate overflow-hidden rounded-[1.75rem] bg-forest-deep px-7 py-7 text-white sm:px-9">
      <SunDrawing />
      <div className="relative z-10 flex flex-wrap items-start justify-between gap-5">
        <div>
          <div className="mb-3 flex items-center gap-2 text-sm text-[#d9e3cf]"><span className="size-1.5 rounded-full bg-[#c8d4a8]" />امروز، {new Intl.DateTimeFormat("fa-IR", { weekday: "long", timeZone: TEHRAN }).format(now)}</div>
          <h3 className="text-3xl leading-normal font-semibold sm:text-[2.7rem]">{fa(persian.day)} {MONTHS[persian.month - 1]} <span className="font-normal text-[#d9e3cf]">{fa(persian.year)}</span></h3>
        </div>
        <span className="flex size-10 items-center justify-center rounded-full border border-white/25 text-[#e2eadb]"><Copy size={17} /></span>
      </div>
      <div className="relative z-10 mt-8 flex flex-wrap items-end justify-between gap-4">
        <div className="flex items-center gap-3"><Clock3 size={19} className="text-[#d9e3cf]" /><span className="text-xs leading-6 text-[#d9e3cf]">ساعت ایران<br />تهران · UTC +۳:۳۰</span></div>
        <time className="text-[2.4rem] leading-none font-medium tracking-wide tabular-nums sm:text-5xl" dir="ltr">{clock}</time>
      </div>
      {showDevice && (
        <div className="relative z-10 mt-5 border-t border-white/15 pt-4">
          <HeroClock now={now} timeZone={device!} label={`${zoneLabel(device!)} (شما)`} />
        </div>
      )}
      <p className="relative z-10 mt-3 min-h-4 text-[0.625rem] text-[#d9e3cf]">بر پایهٔ ساعت دستگاه شما</p>
    </div>
  );
}

// Layout J's side card. `treatment` only changes how the sign is drawn.
function SideCard({ now, treatment }: { now: Date; treatment: 1 | 2 | 3 }) {
  const sign = signFor(now);
  return (
    <div className="flex flex-col justify-between rounded-[1.75rem] border border-line bg-surface p-6 sm:p-7">
      <div className="flex items-center justify-between"><h3 className="text-base font-semibold">امروز در تقویم‌های دیگر</h3><ArrowDownLeft size={19} className="text-muted" /></div>
      <div className="mt-5 border-b border-line pb-4"><div className="flex items-center justify-between text-xs text-muted"><span>میلادی</span><span dir="ltr">GREGORIAN</span></div><p className="mt-2 text-lg font-medium tabular-nums" dir="ltr">{dateNumbers(now, "gregorian")}</p></div>
      <div className="border-b border-line py-4"><div className="flex items-center justify-between text-xs text-muted"><span>هجری قمری</span><span dir="ltr">HIJRI</span></div><p className="mt-2 text-lg font-medium">{formatDate(now, "islamic")}</p></div>

      <div className="relative pt-4">
        {/* 3: an oversized glyph behind the row, the way SunDrawing sits behind the hero */}
        {treatment === 3 && <ZodiacIcon sign={sign} className="pointer-events-none absolute -top-1 left-0 size-24 text-forest opacity-10" strokeWidth={1} />}
        <div className="relative flex items-center justify-between text-xs text-muted"><span>برج فلکی</span><span dir="ltr">ZODIAC</span></div>
        {treatment === 1 && (
          <p className="relative mt-2 flex items-center gap-2 text-lg font-medium">
            <ZodiacIcon sign={sign} className="size-5 text-forest" />
            {sign.name}
            <span className="text-xs font-normal text-muted">عنصر {sign.element}</span>
          </p>
        )}
        {treatment === 2 && (
          <div className="relative mt-2.5 flex items-center gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-leaf text-forest"><ZodiacIcon sign={sign} className="size-5" /></span>
            <span className="min-w-0">
              <span className="block text-lg leading-tight font-medium">{sign.name}</span>
              <span className="block text-[0.625rem] text-muted"><span dir="ltr">{sign.latin}</span> · عنصر {sign.element} · {signRange(now)}</span>
            </span>
          </div>
        )}
        {treatment === 3 && (
          <p className="relative mt-2 flex items-baseline gap-2 text-lg font-medium">
            {sign.name}
            <span className="text-xs font-normal text-muted">عنصر {sign.element}</span>
          </p>
        )}
      </div>
    </div>
  );
}

function Measured({ title, note, children }: { title: string; note: string; children: React.ReactNode }) {
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
      <p className="mt-4 border-t border-line pt-4 text-[0.6875rem] text-muted">
        کارت سبز <span className="tabular-nums text-ink">{size ? fa(size.hero) : "…"}</span> پیکسل ·
        کارت سفید <span className="tabular-nums text-ink">{size ? fa(size.card) : "…"}</span> پیکسل
      </p>
    </section>
  );
}

export function HeroSandbox({ initialNow }: { initialNow: string }) {
  const now = useNow(initialNow);
  const today = signFor(now);
  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-line bg-surface p-5 sm:p-6">
        <h2 className="text-base font-semibold text-ink">هر دوازده برج</h2>
        <p className="mt-1.5 text-xs leading-6 text-muted">
          نشان‌ها SVG هستند، از همان مجموعه‌ای که بقیهٔ آیکن‌های سایت از آن می‌آیند. رنگ را از متن می‌گیرند،
          پس در پوستهٔ تیره هم درست‌اند. هیچ ایموجی و هیچ نویسهٔ فونتی در کار نیست.
        </p>
        <ul className="mt-5 grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
          {SIGNS.map((sign) => (
            <li key={sign.month} className={`flex flex-col items-center gap-2 rounded-xl border p-3 ${sign.month === today.month ? "border-forest bg-leaf" : "border-line"}`}>
              <ZodiacIcon sign={sign} className={`size-7 ${sign.month === today.month ? "text-forest" : "text-ink"}`} />
              <span className="text-xs font-medium">{sign.name}</span>
              <span className="text-[0.625rem] text-muted">{MONTHS[sign.month - 1]}</span>
            </li>
          ))}
        </ul>
        <p className="mt-4 border-t border-line pt-4 text-[0.625rem] leading-6 text-muted">{ZODIAC_NOTICE}</p>
      </section>

      <Measured title="۱ · نشان در همان خط" note="کوچک‌ترین حالت. نشان پیش از نام، هم‌اندازهٔ متن. دقیقاً مثل دو ردیف بالای خودش رفتار می‌کند.">
        <div className="grid gap-5 lg:grid-cols-[1.7fr_1fr]"><Hero now={now} /><SideCard now={now} treatment={1} /></div>
      </Measured>

      <Measured title="۲ · نشان در کادر، با نام لاتین و بازهٔ ماه" note="نشان در یک مربع سبز کم‌رنگ، و یک خط اطلاعات بیشتر: نام لاتین، عنصر، و بازهٔ ماه.">
        <div className="grid gap-5 lg:grid-cols-[1.7fr_1fr]"><Hero now={now} /><SideCard now={now} treatment={2} /></div>
      </Measured>

      <Measured title="۳ · نشان بزرگ و کم‌رنگ در پس‌زمینه" note="نشان می‌رود پشت ردیف، بزرگ و کم‌رنگ، شبیه کاری که طرح خورشید در کارت سبز می‌کند. متن دست‌نخورده می‌ماند.">
        <div className="grid gap-5 lg:grid-cols-[1.7fr_1fr]"><Hero now={now} /><SideCard now={now} treatment={3} /></div>
      </Measured>
    </div>
  );
}
