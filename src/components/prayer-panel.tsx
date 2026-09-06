"use client";

import { useEffect, useMemo, useState } from "react";
import { MapPin, Moon, MoonStar, Sun, Sunrise, Sunset, SunMoon } from "lucide-react";
import { addDays, dayKey, fa } from "@/lib/calendar";
import { CITIES, prayerTimes, PRAYER_NOTICE } from "@/lib/prayer";

const ICONS = [MoonStar, Sunrise, Sun, Sunset, SunMoon, Moon];

export function PrayerPanel({ now }: { now: Date }) {
  const [city, setCity] = useState("tehran");
  const [storageError, setStorageError] = useState(false);
  useEffect(() => {
    try {
      const saved = localStorage.getItem("taghvim-city");
      if (CITIES.some((item) => item.id === saved)) setCity(saved!);
    } catch { setStorageError(true); }
  }, []);
  const key = dayKey(now);
  const times = useMemo(() => prayerTimes(new Date(`${key}T12:00:00Z`), city), [key, city]);
  const next = times.find((time) => time.timestamp > now.getTime()) ?? prayerTimes(addDays(now, 1), city)[0];
  const remaining = Math.max(0, Math.ceil((next.timestamp - now.getTime()) / 60_000));
  function changeCity(value: string) {
    setCity(value);
    try { localStorage.setItem("taghvim-city", value); setStorageError(false); }
    catch { setStorageError(true); }
  }
  return <section id="prayer" className="mt-7 rounded-[1.75rem] border border-line bg-white px-5 py-6 sm:px-7">
    <div className="flex flex-wrap items-center justify-between gap-4"><div><h2 className="text-lg font-semibold">اوقات شرعی امروز</h2><p className="mt-1 text-[11px] text-muted">به افق شهر تو، به وقت ایران</p></div><div className="flex items-center gap-2 rounded-xl border border-line px-3 py-2.5"><MapPin size={16} className="text-forest" /><select aria-label="انتخاب شهر" value={city} onChange={(event) => changeCity(event.target.value)} className="min-w-24 bg-transparent text-xs">{CITIES.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></div></div>
    <div data-testid="prayer-times" className="mt-6 grid grid-cols-3 gap-x-3 gap-y-5 sm:grid-cols-6">
      {times.map((time, i) => {
        const Icon = ICONS[i];
        const upcoming = time.key === next.key && time.timestamp === next.timestamp;
        return <div key={time.key} className={`flex flex-col items-center rounded-xl py-4 ${upcoming ? "bg-leaf text-forest" : "text-ink"}`}><Icon size={22} strokeWidth={1.4} className={upcoming ? "text-forest" : "text-muted"} /><p className="mt-3 text-[11px]">{time.label}</p><time className="mt-2 text-xl font-medium tabular-nums" dir="ltr">{time.time}</time></div>;
      })}
    </div>
    <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4"><p className="text-xs text-forest">{next.label}؛ {fa(Math.floor(remaining / 60))} ساعت و {fa(remaining % 60)} دقیقه دیگر</p><span className="text-[10px] text-muted">روش محاسبه: تهران</span></div>
    <details className="mt-3 text-[10px] leading-6 text-muted"><summary className="cursor-pointer">دقت محاسبات و نیمه‌شب شرعی</summary><p className="pt-2">{PRAYER_NOTICE}</p></details>
    {storageError && <p role="status" className="mt-2 text-xs text-clay">ذخیرهٔ شهر در مرورگر ممکن نیست؛ انتخاب فعلی تا بستن صفحه حفظ می‌شود.</p>}
  </section>;
}
