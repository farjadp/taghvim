// ============================================================================
// Source: src/components/sandbox-tahvil.tsx
// Version: 0.1.0 — 2026-09-10
// Why: SANDBOX. Three places the moment the year turns could live, each with the
//      real next moment and a live countdown. One rule holds in all three: a
//      moment known to the minute never counts seconds. 1406 was published to the
//      minute, so a seconds display would be wrong by up to 59 of them.
// Env / Deps: lib/tahvil, lib/calendar. Throwaway.
// ============================================================================

"use client";

import { useEffect, useState } from "react";
import { fa, formatDate, toCalendar } from "@/lib/calendar";
import { nextTahvil, tahvilFor, tehranClock, type Tahvil } from "@/lib/tahvil";

const pad = (n: number) => fa(String(n).padStart(2, "0"));

// «ساعت ۲۳:۵۴» or «ساعت ۱۸:۱۵:۵۹» — the seconds only when they were announced.
function clockLabel(t: Tahvil): string {
  const { hour, minute, second } = tehranClock(t.instant);
  return t.precision === "second" ? `${pad(hour)}:${pad(minute)}:${pad(second)}` : `${pad(hour)}:${pad(minute)}`;
}

// Days while it is far; hours and minutes on the last day; seconds only if announced.
function remaining(t: Tahvil, now: Date): string {
  let ms = Math.max(0, t.instant.getTime() - now.getTime());
  const days = Math.floor(ms / 86_400_000);
  if (days >= 1) return `${fa(days)} روز`;
  ms -= days * 86_400_000;
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  const s = Math.floor((ms % 60_000) / 1000);
  return t.precision === "second" ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(h)}:${pad(m)}`;
}

function useNow(initialNow: string): Date {
  const [now, setNow] = useState(() => new Date(initialNow));
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return now;
}

// الف — inside «روزشمار», on the Nowruz row it already has.
function InCountdown({ t, now }: { t: Tahvil; now: Date }) {
  return (
    <ul className="rounded-xl border border-line bg-surface">
      <li className="flex items-baseline gap-3 border-b border-line px-4 py-3">
        <span className="min-w-20 text-sm font-medium text-forest">{fa(23)} روز</span>
        <span className="text-xs">روز پزشک</span>
      </li>
      <li className="flex items-baseline gap-3 px-4 py-3">
        <span className="min-w-20 text-sm font-medium text-forest">{remaining(t, now)}</span>
        <span className="flex-1 text-xs">
          <span className="font-medium">نوروز {fa(t.year)}</span>
          <span className="block text-[0.625rem] text-muted">
            تحویل سال {formatDate(t.instant, "persian", true)}، ساعت {clockLabel(t)} به وقت تهران
          </span>
        </span>
      </li>
    </ul>
  );
}

// ب — one line under today's date in the hero, only in the weeks before Nowruz.
function InHero({ t, now }: { t: Tahvil; now: Date }) {
  return (
    <div className="rounded-2xl bg-forest-deep p-5 text-white">
      <p className="text-[0.6875rem] opacity-80">امروز، جمعه</p>
      <p className="mt-1 text-2xl font-semibold">{formatDate(now)}</p>
      <p className="mt-4 border-t border-white/20 pt-3 text-xs">
        تا تحویل سال {fa(t.year)}: <span className="font-medium tabular-nums">{remaining(t, now)}</span>
        <span className="block text-[0.625rem] opacity-75">{formatDate(t.instant, "persian", true)}، ساعت {clockLabel(t)}</span>
      </p>
    </div>
  );
}

// پ — a page of its own: the next moment large, and the years before it.
function OwnPage({ t, now }: { t: Tahvil; now: Date }) {
  const past = [t.year - 3, t.year - 2, t.year - 1].map(tahvilFor);
  return (
    <div className="rounded-2xl border border-line bg-surface p-5">
      <p className="text-xs text-muted">لحظهٔ تحویل سال {fa(t.year)}</p>
      <p className="mt-1 text-3xl font-semibold tabular-nums">{clockLabel(t)}</p>
      <p className="text-xs text-muted">{formatDate(t.instant, "persian", true)} · به وقت تهران</p>
      <p className="mt-3 text-sm">مانده: <span className="font-medium tabular-nums">{remaining(t, now)}</span></p>
      <table className="mt-5 w-full text-right text-[0.6875rem]">
        <tbody>
          {past.map((p) => (
            <tr key={p.year} className="border-t border-line">
              <td className="py-1.5 text-muted">{fa(p.year)}</td>
              <td className="py-1.5 tabular-nums">{clockLabel(p)}</td>
              <td className="py-1.5 text-muted">{formatDate(p.instant)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function SandboxTahvil({ initialNow }: { initialNow: string }) {
  const now = useNow(initialNow);
  const t = nextTahvil(now, toCalendar(now).year);
  // The last day, simulated, so the minute-only rule can be seen rather than trusted.
  const lastDay = new Date(t.instant.getTime() - 5 * 3_600_000 - 17 * 60_000 - 23_000);

  const variants = [
    { id: "countdown", name: "الف · در روزشمار", body: <InCountdown t={t} now={now} />,
      note: "ردیف نوروز که همین حالا در زبانهٔ روزشمار هست، لحظهٔ دقیق را زیر خودش می‌گیرد. کمترین تغییر؛ فقط کسی که به روزشمار سر بزند می‌بیند." },
    { id: "hero", name: "ب · زیر تاریخ امروز", body: <InHero t={t} now={now} />,
      note: "یک خط در هیرو، فقط از اول اسفند تا خود لحظه. پیداترین جا، و فصلی: بقیهٔ سال دیده نمی‌شود." },
    { id: "page", name: "پ · صفحهٔ خودش", body: <OwnPage t={t} now={now} />,
      note: "صفحهٔ /nowruz با لحظه، شمارش و سه سال قبل. قابل اشتراک در شب عید؛ ولی یک صفحهٔ دیگر که کسی باید پیدایش کند." },
  ];

  return (
    <main dir="rtl" className="mx-auto max-w-5xl px-6 py-10">
      <h1 className="text-lg font-medium text-ink">لحظهٔ تحویل سال · سه جا</h1>
      <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted">
        تحویل سال {fa(t.year)}: {formatDate(t.instant, "persian", true)}، ساعت {clockLabel(t)} به وقت تهران.
        {t.precision === "minute"
          ? " مرکز تقویم ژئوفیزیک این سال را تا دقیقه اعلام کرده، پس هیچ‌جا ثانیه شمرده نمی‌شود."
          : " اعلام رسمی تا ثانیه است."}
      </p>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        {variants.map((v) => (
          <section key={v.id} className="flex flex-col gap-3">
            <h2 className="text-sm font-medium text-ink">{v.name}</h2>
            {v.body}
            <p className="text-[0.6875rem] leading-5 text-muted">{v.note}</p>
          </section>
        ))}
      </div>

      <section className="mt-10 rounded-xl border border-line bg-paper p-4">
        <h2 className="text-xs font-medium text-ink">روز آخر، شبیه‌سازی‌شده</h2>
        <p className="mt-1 text-[0.6875rem] leading-5 text-muted">
          پنج ساعت و هفده دقیقه مانده به تحویل {fa(t.year)}، هر سه به همین شکل می‌شمارند:
          <span className="mx-1 font-medium text-ink tabular-nums">{remaining(t, lastDay)}</span>
          {t.precision === "minute" ? "— ساعت و دقیقه، بدون ثانیه." : "— تا ثانیه."}
        </p>
      </section>
    </main>
  );
}
