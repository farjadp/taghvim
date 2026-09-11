// ============================================================================
// Source: src/components/today-panel.tsx
// Version: 0.9.21 — 2026-09-09
// Why: Hero: today in Persian with the live Tehran clock and any second
//      clocks, plus a side card holding the same day in the Gregorian and
//      Hijri calendars and its zodiac sign. Exported in two halves, TodayHero
//      and OtherCalendars, so the Chrome extension can place them itself;
//      TodayPanel composes both for the site and is unchanged in behaviour.
//      On phones this whole block sits BELOW the month grid; see calendar-app.
// Env / Deps: Clock is the device clock rendered in Asia/Tehran, not NTP.
//      The hero cannot clip its own overflow, because the clock picker opens
//      out of it, so the sun drawing is clipped by its own wrapper instead.
// ============================================================================

"use client";

import { useEffect, useState } from "react";
import { ArrowDownLeft, Copy, Check, Clock3, ImageDown } from "lucide-react";
import { dateNumbers, fa, formatDate, toCalendar } from "@/lib/calendar";
import { useMonthNames } from "./month-names-context";
import { signFor } from "@/lib/zodiac";
import { seasonalTahvil, tehranClock, type Tahvil } from "@/lib/tahvil";
import { type EventGroups } from "@/lib/events";
import { type Background, type CardStyle } from "@/lib/card-style";
import { shareDayCard } from "./day-card";
import { WorldClocks } from "./world-clocks";
import { ZodiacIcon } from "./zodiac-icon";

// Ticks every second on the client; the server-rendered value avoids a hydration flash
function LiveClock({ initialNow }: { initialNow: string }) {
  const [now, setNow] = useState(new Date(initialNow));
  useEffect(() => {
    setNow(new Date());
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  return <time className="text-[2.4rem] leading-none font-medium tracking-wide tabular-nums sm:text-5xl" dir="ltr">{new Intl.DateTimeFormat("fa-IR", { timeZone: "Asia/Tehran", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }).format(now)}</time>;
}

// Decorative line-art sunrise; aria-hidden, purely visual
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

// The green card: weekday, date, copy button, Tehran clock and the second clocks.
// «۱۲ روز» while it is far; «۰۵:۱۷» on the last day. Never seconds — see the hero.
function timeLeft(instant: Date, now: Date): string {
  const ms = Math.max(0, instant.getTime() - now.getTime());
  const days = Math.floor(ms / 86_400_000);
  if (days >= 1) return `${fa(days)} روز`;
  const pad = (n: number) => fa(String(n).padStart(2, "0"));
  return `${pad(Math.floor(ms / 3_600_000))}:${pad(Math.floor((ms % 3_600_000) / 60_000))}`;
}

// The announced clock time: to the second only where the second was announced.
function tahvilClock(t: Tahvil): string {
  const { hour, minute, second } = tehranClock(t.instant);
  const pad = (n: number) => fa(String(n).padStart(2, "0"));
  return t.precision === "second" ? `${pad(hour)}:${pad(minute)}:${pad(second)}` : `${pad(hour)}:${pad(minute)}`;
}

export function TodayHero({ now, initialNow, groups, cardStyle, backgrounds }: { now: Date; initialNow: string; groups: EventGroups; cardStyle: CardStyle; backgrounds: Background[] }) {
  const months = useMonthNames();
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);
  // "" while idle; the status line below already exists and says one thing at a time.
  const [cardNote, setCardNote] = useState("");
  const [busy, setBusy] = useState(false);
  const persian = toCalendar(now);
  const tahvil = seasonalTahvil(now, persian);
  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 2500);
    return () => clearTimeout(timer);
  }, [copied]);
  // Clipboard may be unavailable (insecure context, permissions) — surface that, do not crash
  async function copyDate() {
    try {
      await navigator.clipboard.writeText(dateNumbers(now));
      setCopied(true);
      setCopyError(false);
    } catch {
      setCopyError(true);
    }
  }
  // The image is drawn from the day the hero is showing, with the same switches the rest of
  // the page obeys, so what is sent is what was on screen.
  async function shareCard() {
    setBusy(true);
    try {
      const result = await shareDayCard(now, groups, cardStyle, backgrounds, months);
      setCardNote(result === "saved" ? "تصویر ذخیره شد." : result === "shared" ? "تصویر فرستاده شد." : "");
    } catch {
      setCardNote("ساختن تصویر ممکن نشد.");
    } finally {
      setBusy(false);
    }
  }

  return (
      <div className="relative isolate rounded-[1.75rem] bg-forest-deep px-7 py-7 text-white sm:px-9">
        <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[1.75rem]"><SunDrawing /></div>
        <div className="relative z-10 flex flex-wrap items-start justify-between gap-5">
          <div>
            <div className="mb-3 flex items-center gap-2 text-sm text-[#d9e3cf]"><span className="size-1.5 rounded-full bg-[#c8d4a8]" />امروز، {new Intl.DateTimeFormat("fa-IR", { weekday: "long", timeZone: "Asia/Tehran" }).format(now)}</div>
            <h1 className="text-3xl leading-normal font-semibold sm:text-[2.7rem]">{fa(persian.day)} {months[persian.month - 1]} <span className="font-normal text-[#d9e3cf]">{fa(persian.year)}</span></h1>
            {/* From 1 Esfand until the instant itself, and gone the moment the year turns.
                Days while it is far, hours and minutes on the last day, never seconds: the
                hero redraws once a minute, and 1406 was announced to the minute anyway. */}
            {tahvil && <p className="mt-2 text-xs leading-6 text-[#d9e3cf]" data-testid="tahvil">
              تا تحویل سال {fa(tahvil.year)}: <span className="font-medium text-white tabular-nums">{timeLeft(tahvil.instant, now)}</span>
              <span className="block text-[0.625rem] opacity-90">{formatDate(tahvil.instant, "persian", true, months)}، ساعت {tahvilClock(tahvil)} به وقت تهران</span>
            </p>}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={shareCard} disabled={busy} aria-label="تصویر امروز" title="تصویر امروز" className="flex size-10 items-center justify-center rounded-full border border-white/25 text-[#e2eadb] transition-colors hover:bg-white/10 disabled:opacity-50"><ImageDown size={17} /></button>
            <button onClick={copyDate} aria-label="کپی تاریخ امروز" className="flex size-10 items-center justify-center rounded-full border border-white/25 text-[#e2eadb] transition-colors hover:bg-white/10">{copied ? <Check size={17} /> : <Copy size={17} />}</button>
          </div>
        </div>
        <div className="relative z-10 mt-8 flex flex-wrap items-end justify-between gap-4">
          <div className="flex items-center gap-3"><Clock3 size={19} className="text-[#d9e3cf]" /><span className="text-xs leading-6 text-[#d9e3cf]">ساعت ایران<br />تهران · UTC +۳:۳۰</span></div>
          <LiveClock initialNow={initialNow} />
        </div>
        {/* Above the footnote below it: the city picker opens over that line, and
            equal z-index would let the paragraph swallow the clicks. */}
        <div className="relative z-20 mt-5"><WorldClocks now={now} /></div>
        <p className="relative z-10 mt-3 min-h-4 text-[0.625rem] text-[#d9e3cf]" role="status">{copyError ? "کپی در دسترس نیست؛ تاریخ را انتخاب و کپی کنید." : copied ? "تاریخ کپی شد." : cardNote}</p>
      </div>
  );
}

// The white card: the same day in the Gregorian and Hijri calendars, and the
// sign of the month, drawn once small beside its name and once large and
// faint behind the whole card, the way the hero carries its sun.
export function OtherCalendars({ now }: { now: Date }) {
  const sign = signFor(now);
  return (
      <div data-testid="other-calendars" className="relative isolate flex flex-col justify-between overflow-hidden rounded-[1.75rem] border border-line bg-surface p-6 sm:p-7">
        <ZodiacIcon sign={sign} className="pointer-events-none absolute -bottom-6 -left-6 size-44 text-forest opacity-[0.07]" strokeWidth={1} />
        <div className="relative z-10 flex items-center justify-between"><h2 className="text-base font-semibold">امروز در تقویم‌های دیگر</h2><ArrowDownLeft size={19} className="text-muted" /></div>
        <div className="relative z-10 mt-5 border-b border-line pb-4"><div className="flex items-center justify-between text-xs text-muted"><span>میلادی</span><span dir="ltr">GREGORIAN</span></div><p className="mt-2 text-lg font-medium tabular-nums" dir="ltr">{dateNumbers(now, "gregorian")}</p><p className="mt-1 text-xs text-muted" dir="ltr">{formatDate(now, "gregorian", true)}</p></div>
        <div className="relative z-10 border-b border-line py-4"><div className="flex items-center justify-between text-xs text-muted"><span>هجری قمری</span><span dir="ltr">HIJRI</span></div><p className="mt-2 text-lg font-medium">{formatDate(now, "islamic")}</p><p className="mt-1 text-[0.625rem] text-muted">محاسباتی؛ ممکن است با تقویم رسمی یک روز اختلاف داشته باشد.</p></div>
        <div className="relative z-10 pt-4"><div className="flex items-center justify-between text-xs text-muted"><span>برج فلکی</span><span dir="ltr">ZODIAC</span></div><p className="mt-2 flex flex-wrap items-center gap-2 text-lg font-medium"><ZodiacIcon sign={sign} className="size-5 text-forest" />{sign.name}<span className="text-xs font-normal text-muted">عنصر {sign.element}</span></p></div>
      </div>
  );
}

// What the site renders: both cards side by side on desktop, stacked on phones.
export function TodayPanel({ now, initialNow, groups, cardStyle, backgrounds, className = "" }: { now: Date; initialNow: string; groups: EventGroups; cardStyle: CardStyle; backgrounds: Background[]; className?: string }) {
  return (
    <section aria-label="تاریخ و ساعت امروز" className={`grid gap-5 lg:grid-cols-[1.7fr_1fr] ${className}`}>
      <TodayHero now={now} initialNow={initialNow} groups={groups} cardStyle={cardStyle} backgrounds={backgrounds} />
      <OtherCalendars now={now} />
    </section>
  );
}
