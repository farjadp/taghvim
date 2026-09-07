// ============================================================================
// Source: src/components/today-panel.tsx
// Version: 0.2.0 — 2026-09-07
// Why: Hero: today in Persian with a live Tehran clock, plus Gregorian and
//      Hijri equivalents and a copy-to-clipboard button.
// Env / Deps: Clock is the device clock rendered in Asia/Tehran, not NTP.
// ============================================================================

"use client";

import { useEffect, useState } from "react";
import { ArrowDownLeft, Copy, Check, Clock3 } from "lucide-react";
import { dateNumbers, fa, formatDate, MONTHS, toCalendar } from "@/lib/calendar";

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

export function TodayPanel({ now, initialNow }: { now: Date; initialNow: string }) {
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);
  const persian = toCalendar(now);
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
  return (
    <section aria-label="تاریخ و ساعت امروز" className="grid gap-5 lg:grid-cols-[1.7fr_1fr]">
      <div className="relative isolate overflow-hidden rounded-[1.75rem] bg-forest px-7 py-7 text-white sm:px-9">
        <SunDrawing />
        <div className="relative z-10 flex flex-wrap items-start justify-between gap-5">
          <div>
            <div className="mb-3 flex items-center gap-2 text-sm text-[#d9e3cf]"><span className="size-1.5 rounded-full bg-[#c8d4a8]" />امروز، {new Intl.DateTimeFormat("fa-IR", { weekday: "long", timeZone: "Asia/Tehran" }).format(now)}</div>
            <h1 className="text-3xl leading-normal font-semibold sm:text-[2.7rem]">{fa(persian.day)} {MONTHS[persian.month - 1]} <span className="font-normal text-[#d9e3cf]">{fa(persian.year)}</span></h1>
            <p className="mt-2 text-sm text-[#d9e3cf]">یک روز تازه، یک فرصت تازه.</p>
          </div>
          <button onClick={copyDate} aria-label="کپی تاریخ امروز" className="flex size-10 items-center justify-center rounded-full border border-white/25 text-[#e2eadb] transition-colors hover:bg-white/10">{copied ? <Check size={17} /> : <Copy size={17} />}</button>
        </div>
        <div className="relative z-10 mt-8 flex flex-wrap items-end justify-between gap-4">
          <div className="flex items-center gap-3"><Clock3 size={19} className="text-[#d9e3cf]" /><span className="text-xs leading-6 text-[#d9e3cf]">ساعت ایران<br />تهران · UTC +۳:۳۰</span></div>
          <LiveClock initialNow={initialNow} />
        </div>
        <p className="relative z-10 mt-3 min-h-4 text-[10px] text-[#d9e3cf]" role="status">{copyError ? "کپی در دسترس نیست؛ تاریخ را انتخاب و کپی کنید." : copied ? "تاریخ کپی شد." : "بر پایهٔ ساعت دستگاه شما"}</p>
      </div>
      <div className="flex flex-col justify-between rounded-[1.75rem] border border-line bg-white p-6 sm:p-7">
        <div className="flex items-center justify-between"><h2 className="text-base font-semibold">امروز در تقویم‌های دیگر</h2><ArrowDownLeft size={19} className="text-muted" /></div>
        <div className="mt-5 border-b border-line pb-5"><div className="flex items-center justify-between text-xs text-muted"><span>میلادی</span><span dir="ltr">GREGORIAN</span></div><p className="mt-3 text-xl font-medium tabular-nums" dir="ltr">{dateNumbers(now, "gregorian")}</p><p className="mt-1 text-xs text-muted" dir="ltr">{formatDate(now, "gregorian", true)}</p></div>
        <div className="pt-4"><div className="flex items-center justify-between text-xs text-muted"><span>هجری قمری</span><span dir="ltr">HIJRI</span></div><p className="mt-2 text-lg font-medium">{formatDate(now, "islamic")}</p><p className="mt-1 text-[10px] text-muted">محاسباتی؛ ممکن است با تقویم رسمی یک روز اختلاف داشته باشد.</p></div>
      </div>
    </section>
  );
}
