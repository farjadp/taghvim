// ============================================================================
// Source: src/components/sandbox-day-card.tsx
// Version: 0.1.0 — 2026-09-09
// Why: SANDBOX. Three designs for the day card, drawn from the real data with
//      the real renderer, each downloadable and each reporting the file size
//      it actually produces.
// Env / Deps: lib/day-card and components/day-card. Delete this file and
//      src/app/sandbox/day-card/page.tsx to drop the sandbox; the renderer and
//      the library stand alone.
// ============================================================================

"use client";

import { useEffect, useRef, useState } from "react";
import { Download } from "lucide-react";
import { fa, formatDate, fromCalendar, toCalendar } from "@/lib/calendar";
import { ALL_GROUPS, DEFAULT_GROUPS, type EventGroups } from "@/lib/events";
import { cardFilename, dayCard } from "@/lib/day-card";
import { drawDayCard, loadCardFont, VARIANTS, type CardVariant } from "./day-card";

function Preview({ now, groups, variant, onSize }: {
  now: Date; groups: EventGroups; variant: CardVariant; onSize: (bytes: number) => void;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const report = useRef(onSize);
  report.current = onSize;
  const card = dayCard(now, groups);
  useEffect(() => {
    let cancelled = false;
    loadCardFont().then(() => {
      const canvas = ref.current;
      if (cancelled || !canvas) return;
      drawDayCard(canvas, card, variant);
      // The real weight of the real file, not an estimate.
      canvas.toBlob((blob) => { if (blob && !cancelled) report.current(blob.size); }, "image/png");
    });
    return () => { cancelled = true; };
  });

  function download() {
    const canvas = ref.current;
    if (!canvas) return;
    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = cardFilename(now).replace(".png", `-${variant}.png`);
      link.click();
      URL.revokeObjectURL(url);
    }, "image/png");
  }

  return (
    <div>
      <canvas ref={ref} data-variant={variant} className="h-auto w-full rounded-2xl border border-line" />
      <button type="button" onClick={download} className="mt-3 flex items-center gap-1.5 text-xs font-medium text-forest hover:underline">
        <Download size={14} />ذخیره
      </button>
    </div>
  );
}

export function SandboxDayCard({ initialNow }: { initialNow: string }) {
  const today = new Date(initialNow);
  const year = toCalendar(today).year;
  // A design judged only on today is judged on whatever today happens to hold — and today
  // may hold nothing at all. These three cover empty, one occasion, and a crowded day.
  const DAYS = [
    { key: "today", label: "امروز", date: today },
    { key: "nowruz", label: "نوروز", date: fromCalendar({ year: year + 1, month: 1, day: 1 }) },
    { key: "crowded", label: "روزی شلوغ", date: fromCalendar({ year, month: 6, day: 13 }) },
  ] as const;
  const [day, setDay] = useState<(typeof DAYS)[number]["key"]>("today");
  const now = DAYS.find((item) => item.key === day)!.date;
  const [groups, setGroups] = useState<EventGroups>(DEFAULT_GROUPS);
  const [sizes, setSizes] = useState<Record<string, number>>({});
  const card = dayCard(now, groups);

  return (
    <div className="mx-auto max-w-[1240px] px-4 py-10 sm:px-8">
      <h1 className="text-sm font-semibold">سندباکس · کارت روز</h1>
      <p className="mt-1 max-w-3xl text-[0.6875rem] leading-5 text-muted">
        هر سه کارت با دادهٔ واقعی امروز و با همان رندرکنندهٔ نهایی کشیده شده‌اند — تصویر در
        مرورگر خودت ساخته می‌شود و هیچ‌جا فرستاده نمی‌شود. حجم زیر هر کدام، حجم واقعی فایل PNG
        همان کارت است. دکمهٔ «ذخیره» فایل واقعی را می‌دهد؛ روی گوشی هم امتحانش کن.
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        {DAYS.map(({ key, label }) => (
          <button key={key} aria-pressed={day === key} onClick={() => setDay(key)}
            className={`rounded-lg px-3 py-1.5 text-[0.6875rem] ${day === key ? "bg-leaf font-medium text-forest" : "text-muted hover:bg-paper"}`}>{label}</button>
        ))}
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-3">
        {([["پیش‌فرض", DEFAULT_GROUPS], ["همهٔ دسته‌ها", ALL_GROUPS]] as const).map(([label, value]) => (
          <button key={label} aria-pressed={groups === value} onClick={() => setGroups(value)}
            className={`rounded-lg px-3 py-1.5 text-[0.6875rem] ${groups === value ? "bg-leaf font-medium text-forest" : "text-muted hover:bg-paper"}`}>{label}</button>
        ))}
        <span className="text-[0.625rem] text-muted">
          {formatDate(now, "persian", true)} · {fa(card.occasions.length)} مناسبت روی کارت
        </span>
      </div>

      <div className="mt-6 grid items-start gap-6 lg:grid-cols-3">
        {VARIANTS.map(({ key, label, width, height }) => (
          <section key={key}>
            <h2 className="mb-2 text-xs font-semibold">{label}</h2>
            <Preview now={now} groups={groups} variant={key}
              onSize={(bytes) => setSizes((current) => (current[key] === bytes ? current : { ...current, [key]: bytes }))} />
            <p data-testid={`size-${key}`} className="mt-2 text-[0.625rem] text-clay">
              {fa(width)}×{fa(height)} · {sizes[key] ? `${fa(Math.round(sizes[key] / 1024))} کیلوبایت` : "…"}
            </p>
          </section>
        ))}
      </div>
    </div>
  );
}
