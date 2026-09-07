// ============================================================================
// Source: src/components/sandbox-hero.tsx
// Version: 0.8.0-sandbox — 2026-09-07
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
import { ZODIAC_NOTICE, signFor, signProgress, signRange } from "@/lib/zodiac";
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


// The other two calendars as one compact row, for when they move into the hero.
function CalendarsInHero({ now }: { now: Date }) {
  return (
    <div className="relative z-10 mt-5 grid grid-cols-2 gap-4 border-t border-white/15 pt-4 text-[#d9e3cf]">
      <div>
        <p className="text-[0.625rem] opacity-75">میلادی</p>
        <p className="mt-1 text-base font-medium tabular-nums text-white" dir="ltr">{dateNumbers(now, "gregorian")}</p>
      </div>
      <div>
        <p className="text-[0.625rem] opacity-75">هجری قمری</p>
        <p className="mt-1 text-base font-medium text-white">{formatDate(now, "islamic")}</p>
      </div>
    </div>
  );
}

// The zodiac card: sign, element, the month it covers, and how far into it we
// are. Deliberately astronomical only, no horoscope.
function ZodiacCard({ now, children }: { now: Date; children?: React.ReactNode }) {
  const sign = signFor(now);
  const progress = Math.round(signProgress(now) * 100);
  return (
    <div className="flex flex-col rounded-[1.75rem] border border-line bg-surface p-6 sm:p-7">
      <div className="flex items-center justify-between"><h3 className="text-base font-semibold">برج فلکی امروز</h3><span dir="ltr" className="text-xs text-muted">ZODIAC</span></div>
      <div className="mt-5 flex items-center gap-4">
        <span aria-hidden="true" className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-leaf text-3xl leading-none text-forest">{sign.symbol}</span>
        <div className="min-w-0">
          <p className="text-2xl font-semibold text-ink">{sign.name}</p>
          <p className="mt-0.5 text-xs text-muted"><span dir="ltr">{sign.latin}</span> · عنصر {sign.element}</p>
        </div>
      </div>
      <div className="mt-5">
        <div className="flex items-center justify-between text-[0.6875rem] text-muted"><span>{signRange(now)}</span><span className="tabular-nums">{fa(progress)}٪</span></div>
        {/* SANDBOX ONLY: an inline width. A shipped version would use a transform or a fixed set of steps, since the project bans inline styles. */}
        <div className="mt-2 h-1 overflow-hidden rounded-full bg-paper"><div className="h-full rounded-full bg-forest" style={{ width: `${progress}%` }} /></div>
      </div>
      {children}
      <details className="mt-4 text-[0.625rem] leading-6 text-muted"><summary className="cursor-pointer">دربارهٔ برج‌ها</summary><p className="pt-2">{ZODIAC_NOTICE}</p></details>
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
        title="ت · پیشنهاد تو، کامل"
        note="کارت سفید کلاً می‌شود برج فلکی به‌علاوهٔ ساعت شهرها. میلادی و قمری می‌روند داخل کارت سبز، زیر ساعت ایران، در دو ستون."
        tone="good"
        verdict="فضای خالی پر می‌شود و هر کارت یک موضوع دارد: سبز «امروز و زمان»، سفید «آسمان امروز». شلوغ‌ترین گزینه هم همین است."
      >
        <div className="grid gap-5 lg:grid-cols-[1.7fr_1fr]">
          <Hero now={now}>
            <CalendarsInHero now={now} />
          </Hero>
          <ZodiacCard now={now}>
            <div className="mt-4 border-t border-line pt-4"><WorldClocks now={now} /></div>
          </ZodiacCard>
        </div>
      </Measured>

      <Measured
        title="ث · همان، ولی ساعت‌ها هم داخل کارت سبز"
        note="مثل «ت»، با این فرق که ساعت شهرها هم می‌روند کنار ساعت ایران. کارت سفید فقط و فقط برج فلکی می‌ماند."
        tone="good"
        verdict="تمیزترین تقسیم: هرچه به زمان مربوط است یک‌جا، آسمان جای دیگر. کارت سبز پرتر می‌شود."
      >
        <div className="grid gap-5 lg:grid-cols-[1.7fr_1fr]">
          <Hero now={now}>
            {showDevice && (
              <div className="relative z-10 mt-5 space-y-2.5 border-t border-white/15 pt-4">
                <HeroClock now={now} timeZone={device!} label={`${zoneLabel(device!)} (شما)`} />
              </div>
            )}
            <CalendarsInHero now={now} />
          </Hero>
          <ZodiacCard now={now} />
        </div>
      </Measured>

      <Measured
        title="ج · برج فلکی بدون جابه‌جایی چیز دیگر"
        note="میلادی و قمری سر جایشان می‌مانند و برج فلکی زیرشان در همان کارت سفید اضافه می‌شود. ساعت‌ها هم در کارت سبز، مثل «ب»."
        tone="bad"
        verdict="کم‌ترین ریسک، ولی کارت سفید سه موضوع پیدا می‌کند و بلندتر از همه می‌شود."
      >
        <div className="grid gap-5 lg:grid-cols-[1.7fr_1fr]">
          <Hero now={now}>
            {showDevice && (
              <div className="relative z-10 mt-5 space-y-2.5 border-t border-white/15 pt-4">
                <HeroClock now={now} timeZone={device!} label={`${zoneLabel(device!)} (شما)`} />
              </div>
            )}
          </Hero>
          <div className="flex flex-col justify-between rounded-[1.75rem] border border-line bg-surface p-6 sm:p-7">
            <div className="flex items-center justify-between"><h3 className="text-base font-semibold">امروز در تقویم‌های دیگر</h3><ArrowDownLeft size={19} className="text-muted" /></div>
            <div className="mt-5 border-b border-line pb-4"><div className="flex items-center justify-between text-xs text-muted"><span>میلادی</span><span dir="ltr">GREGORIAN</span></div><p className="mt-2 text-lg font-medium tabular-nums" dir="ltr">{dateNumbers(now, "gregorian")}</p></div>
            <div className="border-b border-line py-4"><div className="flex items-center justify-between text-xs text-muted"><span>هجری قمری</span><span dir="ltr">HIJRI</span></div><p className="mt-2 text-lg font-medium">{formatDate(now, "islamic")}</p></div>
            <div className="pt-4">
              <div className="flex items-center justify-between text-xs text-muted"><span>برج فلکی</span><span dir="ltr">ZODIAC</span></div>
              <p className="mt-2 flex items-center gap-2 text-lg font-medium"><span aria-hidden="true" className="text-forest">{signFor(now).symbol}</span>{signFor(now).name}<span className="text-xs font-normal text-muted">عنصر {signFor(now).element}</span></p>
            </div>
          </div>
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
