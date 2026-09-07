// ============================================================================
// Source: src/components/sandbox-clocks.tsx
// Version: 0.7.0-sandbox — 2026-09-07
// Why: SANDBOX. The three candidate designs for a second clock, rendered with
//      the real tokens and the real hero markup so what is on screen is what
//      would ship. Each one states its own cost underneath.
// Env / Deps: lib/clocks, lib/calendar. Not imported by any live page.
// ============================================================================

"use client";

import { useEffect, useRef, useState } from "react";
import { Clock3, Globe2, Plus, X } from "lucide-react";
import { MONTHS, fa, toCalendar } from "@/lib/calendar";
import { TEHRAN, ZONES, dayShift, deviceZone, matchesTehran, offsetFromTehran, timeIn, zoneLabel } from "@/lib/clocks";

// Ticks once a second, shared by every variant on the page
function useNow(initialNow: string) {
  const [now, setNow] = useState(() => new Date(initialNow));
  useEffect(() => {
    setNow(new Date());
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  return now;
}

// The device zone is unknown on the server, so it arrives after mount
function useDeviceZone() {
  const [zone, setZone] = useState<string | null>(null);
  useEffect(() => { setZone(deviceZone()); }, []);
  return zone;
}

function Hero({ now, children, footnote }: { now: Date; children?: React.ReactNode; footnote?: string }) {
  const persian = toCalendar(now);
  const clock = new Intl.DateTimeFormat("fa-IR", { timeZone: TEHRAN, hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }).format(now);
  return (
    <div className="relative isolate overflow-hidden rounded-[1.75rem] bg-forest-deep px-7 py-7 text-white sm:px-9">
      <div className="mb-3 flex items-center gap-2 text-sm text-[#d9e3cf]"><span className="size-1.5 rounded-full bg-[#c8d4a8]" />امروز، {new Intl.DateTimeFormat("fa-IR", { weekday: "long", timeZone: TEHRAN }).format(now)}</div>
      <h2 className="text-3xl leading-normal font-semibold sm:text-[2.7rem]">{fa(persian.day)} {MONTHS[persian.month - 1]} <span className="font-normal text-[#d9e3cf]">{fa(persian.year)}</span></h2>
      <div className="mt-8 flex flex-wrap items-end justify-between gap-4">
        <div className="flex items-center gap-3"><Clock3 size={19} className="text-[#d9e3cf]" /><span className="text-xs leading-6 text-[#d9e3cf]">ساعت ایران<br />تهران · UTC +۳:۳۰</span></div>
        <time className="text-[2.4rem] leading-none font-medium tracking-wide tabular-nums sm:text-5xl" dir="ltr">{clock}</time>
      </div>
      {children}
      <p className="mt-3 min-h-4 text-[0.625rem] text-[#d9e3cf]">{footnote ?? "بر پایهٔ ساعت دستگاه شما"}</p>
    </div>
  );
}

function Variant({ title, cost, verdict, children }: { title: string; cost: string; verdict: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-line bg-surface p-5 sm:p-6">
      <h2 className="text-base font-semibold text-ink">{title}</h2>
      <p className="mt-1.5 text-xs leading-6 text-muted">{cost}</p>
      <div className="mt-5">{children}</div>
      <p className="mt-4 border-t border-line pt-4 text-xs leading-6 text-forest">{verdict}</p>
    </section>
  );
}

// ---------------------------------------------------------------------------
// A · the visitor's own clock, added silently when it differs from Tehran
// ---------------------------------------------------------------------------
function VariantA({ now }: { now: Date }) {
  const zone = useDeviceZone();
  const show = zone !== null && !matchesTehran(now, zone);
  return (
    <Hero now={now}>
      {show && (
        <div className="mt-4 flex items-center justify-between border-t border-white/15 pt-4 text-[#d9e3cf]">
          <span className="text-xs">ساعت شما · {zoneLabel(zone!)}</span>
          <span className="flex items-baseline gap-2">
            {dayShift(now, zone!) && <span className="text-[0.625rem]">{dayShift(now, zone!)}</span>}
            <time className="text-lg font-medium tabular-nums" dir="ltr">{timeIn(now, zone!)}</time>
          </span>
        </div>
      )}
    </Hero>
  );
}

// ---------------------------------------------------------------------------
// B · chips inside the hero, up to two cities the visitor picks
// ---------------------------------------------------------------------------
function VariantB({ now }: { now: Date }) {
  const [picked, setPicked] = useState<string[]>(["toronto"]);
  const [open, setOpen] = useState(false);
  const chosen = ZONES.filter((zone) => picked.includes(zone.id));
  const rest = ZONES.filter((zone) => !picked.includes(zone.id));
  return (
    <Hero now={now}>
      <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-white/15 pt-4">
        {chosen.map((zone) => (
          <span key={zone.id} className="flex items-center gap-2 rounded-full border border-white/20 py-1.5 pr-3 pl-1.5 text-xs text-[#d9e3cf]">
            {zone.city}
            <time className="font-medium tabular-nums text-white" dir="ltr">{timeIn(now, zone.timeZone)}</time>
            <button aria-label={`حذف ${zone.city}`} onClick={() => setPicked(picked.filter((id) => id !== zone.id))} className="flex size-5 items-center justify-center rounded-full hover:bg-white/15"><X size={12} /></button>
          </span>
        ))}
        {picked.length < 2 && (
          <button onClick={() => setOpen(!open)} aria-expanded={open} className="flex items-center gap-1.5 rounded-full border border-dashed border-white/30 px-3 py-1.5 text-xs text-[#d9e3cf] hover:bg-white/10"><Plus size={13} />شهر</button>
        )}
      </div>
      {open && picked.length < 2 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {rest.map((zone) => (
            <button key={zone.id} onClick={() => { setPicked([...picked, zone.id]); setOpen(false); }} className="rounded-lg bg-white/10 px-2.5 py-1 text-[0.6875rem] text-[#e2eadb] hover:bg-white/20">{zone.city}</button>
          ))}
        </div>
      )}
    </Hero>
  );
}

// ---------------------------------------------------------------------------
// C · the hero untouched; clocks live in the card that already holds the
//     other calendars, so the page gains a row, not a new element
// ---------------------------------------------------------------------------
function VariantC({ now }: { now: Date }) {
  const device = useDeviceZone();
  const [picked, setPicked] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const menu = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    function onPointer(event: PointerEvent) { if (!menu.current?.contains(event.target as Node)) setOpen(false); }
    document.addEventListener("pointerdown", onPointer);
    return () => document.removeEventListener("pointerdown", onPointer);
  }, [open]);
  const auto = device && !matchesTehran(now, device) ? [{ id: "__device", city: `${zoneLabel(device)} (شما)`, timeZone: device }] : [];
  const chosen = [...auto, ...ZONES.filter((zone) => picked.includes(zone.id) && zone.timeZone !== device)];
  const rest = ZONES.filter((zone) => !picked.includes(zone.id) && zone.timeZone !== device);
  return (
    <div className="grid gap-5 lg:grid-cols-[1.7fr_1fr]">
      <Hero now={now} />
      <div className="flex flex-col rounded-[1.75rem] border border-line bg-surface p-6 sm:p-7">
        <div className="flex items-center justify-between"><h3 className="text-base font-semibold">امروز در تقویم‌های دیگر</h3><Globe2 size={18} className="text-muted" /></div>
        <div className="mt-5 border-b border-line pb-4"><div className="flex items-center justify-between text-xs text-muted"><span>میلادی</span><span dir="ltr">GREGORIAN</span></div><p className="mt-2 text-lg font-medium tabular-nums" dir="ltr">2026-09-07</p></div>
        <div className="border-b border-line py-4"><div className="flex items-center justify-between text-xs text-muted"><span>هجری قمری</span><span dir="ltr">HIJRI</span></div><p className="mt-2 text-base font-medium">۲۴ ربیع‌الاول ۱۴۴۸</p></div>
        <div className="pt-4">
          <div className="flex items-center justify-between text-xs text-muted"><span>ساعت شهرهای دیگر</span><span dir="ltr">CLOCKS</span></div>
          {chosen.length === 0 && <p className="mt-3 text-[0.6875rem] leading-6 text-muted">هنوز شهری اضافه نشده.</p>}
          {chosen.map((zone) => (
            <div key={zone.id} className="mt-3 flex items-center justify-between">
              <span className="flex items-center gap-2 text-xs text-ink">
                {zone.city}
                {dayShift(now, zone.timeZone) && <span className="rounded bg-paper px-1.5 py-0.5 text-[0.625rem] text-muted">{dayShift(now, zone.timeZone)}</span>}
              </span>
              <span className="flex items-center gap-2">
                <time className="text-base font-medium tabular-nums" dir="ltr">{timeIn(now, zone.timeZone)}</time>
                {zone.id !== "__device" && <button aria-label={`حذف ${zone.city}`} onClick={() => setPicked(picked.filter((id) => id !== zone.id))} className="text-muted hover:text-clay"><X size={13} /></button>}
              </span>
            </div>
          ))}
          {chosen.length > 0 && <p className="mt-2 text-[0.625rem] text-muted">{offsetFromTehran(now, chosen[0].timeZone) || "هم‌زمان با تهران"}</p>}
          {picked.length < 2 && (
            <div ref={menu} className="relative mt-4">
              <button onClick={() => setOpen(!open)} aria-expanded={open} className="flex items-center gap-1.5 text-xs font-medium text-forest"><Plus size={14} />افزودن شهر</button>
              {open && (
                <div className="absolute right-0 z-20 mt-2 flex w-56 flex-wrap gap-1.5 rounded-xl border border-line bg-surface p-3 shadow-lg">
                  {rest.map((zone) => <button key={zone.id} onClick={() => { setPicked([...picked, zone.id]); setOpen(false); }} className="rounded-lg bg-paper px-2.5 py-1 text-[0.6875rem] text-ink hover:bg-leaf">{zone.city}</button>)}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function ClockSandbox({ initialNow }: { initialNow: string }) {
  const now = useNow(initialNow);
  const device = useDeviceZone();
  return (
    <div className="space-y-6">
      <p className="rounded-xl bg-paper px-4 py-3 text-xs leading-6 text-muted">
        منطقهٔ زمانی این مرورگر: <span dir="ltr" className="text-ink">{device ?? "…"}</span>
        {device && !matchesTehran(now, device) && <> · {offsetFromTehran(now, device)} از تهران</>}
        {device && matchesTehran(now, device) && <> · هم‌زمان با تهران، پس نسخهٔ «الف» چیزی نشان نمی‌دهد</>}
      </p>

      <Variant
        title="الف · ساعت خودت، خودکار"
        cost="بدون تنظیمات، بدون دکمه. اگر منطقهٔ زمانی مرورگر با تهران فرق داشت، یک خط زیر ساعت اصلی اضافه می‌شود. داخل ایران هیچ‌چیز عوض نمی‌شود."
        verdict="ارزان‌ترین گزینه. مشکل تو را حل می‌کند ولی شهر دلخواه اضافه نمی‌کند."
      >
        <VariantA now={now} />
      </Variant>

      <Variant
        title="ب · تراشه‌های شهر، داخل کارت اصلی"
        cost="تا دو شهر دلخواه، همان بالا کنار ساعت تهران. انتخاب ذخیره می‌شود."
        verdict="بیشترین دیده‌شدن و بیشترین خطر شلوغی: کارت اصلی صفحه است و روی موبایل یک ردیف دیگر می‌گیرد."
      >
        <VariantB now={now} />
      </Variant>

      <Variant
        title="پ · داخل کارت «تقویم‌های دیگر»"
        cost="کارت اصلی دست‌نخورده. ساعت‌ها می‌روند کنار تاریخ میلادی و قمری، در کارتی که همین حالا کارش «همین روز، به زبان دیگر» است. ساعت خودت خودکار می‌آید، تا دو شهر هم دستی."
        verdict="پیشنهاد من. هم مشکل تو را حل می‌کند، هم شهر دلخواه می‌دهد، و کارت اصلی را دست نمی‌زند."
      >
        <VariantC now={now} />
      </Variant>
    </div>
  );
}
