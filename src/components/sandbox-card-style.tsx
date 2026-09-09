// ============================================================================
// Source: src/components/sandbox-card-style.tsx
// Version: 0.1.0 — 2026-09-09
// Why: SANDBOX. Every background the card could have — the palettes and each
//      photograph in public/backgrounds — drawn with the real renderer and the
//      real data, so the choice is made on the thing rather than on a mockup.
// Env / Deps: The list comes from the server page. Delete this file and
//      src/app/sandbox/card-style/page.tsx to drop the sandbox; lib/card-style,
//      lib/backgrounds and the renderer stand alone.
// ============================================================================

"use client";

import { useEffect, useRef, useState } from "react";
import { Download } from "lucide-react";
import { dayKey, fa, formatDate } from "@/lib/calendar";
import { ALL_GROUPS, DEFAULT_GROUPS, type EventGroups } from "@/lib/events";
import { cardFilename, dayCard } from "@/lib/day-card";
import { PALETTES, PHOTO_COLOURS, type Background, type CardColours } from "@/lib/card-style";
import { cardFormat, drawDayCard, loadBackground, loadCardFont } from "./day-card";

// Previews are drawn at a third of the real card. Seventeen full-size backing stores is
// eighty megabytes of canvas for a page whose job is «which one do you like».
const PREVIEW = 1 / 3;

function Card({ now, groups, colours, photo, label, onSize }: {
  now: Date; groups: EventGroups; colours: CardColours; photo?: Background; label: string;
  onSize: (bytes: number) => void;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const report = useRef(onSize);
  report.current = onSize;
  // Keyed on what actually changes the picture. Without a dependency array this effect
  // re-ran on every render and its cleanup cancelled the previous run — with twenty-two
  // cards each reporting a size and re-rendering the parent, the slow ones (the photos,
  // which have to decode first) were cancelled forever and never drew at all.
  const key = `${dayKey(now)}|${groups.religious}${groups.state}${groups.world}|${colours.background}|${photo?.src ?? ""}`;
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const card = dayCard(now, groups);
      const [, image] = await Promise.all([loadCardFont(), photo ? loadBackground(photo.src) : undefined]);
      const canvas = ref.current;
      if (cancelled || !canvas) return;
      drawDayCard(canvas, card, { colours, photo: image, scale: PREVIEW });
      // The exported file is full size, so its weight is measured on a full-size draw.
      const full = document.createElement("canvas");
      drawDayCard(full, card, { colours, photo: image });
      const format = cardFormat(Boolean(image));
      full.toBlob((blob) => { if (blob && !cancelled) report.current(blob.size); }, format.type, format.quality);
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  async function download() {
    const [, image] = await Promise.all([loadCardFont(), photo ? loadBackground(photo.src) : undefined]);
    const full = document.createElement("canvas");
    drawDayCard(full, dayCard(now, groups), { colours, photo: image });
    const format = cardFormat(Boolean(image));
    full.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const name = cardFilename(now, format.extension);
      link.href = url;
      link.download = name.replace(`.${format.extension}`, `-${label}.${format.extension}`);
      link.click();
      URL.revokeObjectURL(url);
    }, format.type, format.quality);
  }

  return (
    <div>
      <canvas ref={ref} className="h-auto w-full rounded-xl border border-line" />
      <button type="button" onClick={download} className="mt-2 flex items-center gap-1.5 text-[0.625rem] font-medium text-forest hover:underline">
        <Download size={12} />ذخیره
      </button>
    </div>
  );
}

export function SandboxCardStyle({ initialNow, backgrounds }: { initialNow: string; backgrounds: Background[] }) {
  const now = new Date(initialNow);
  const [groups, setGroups] = useState<EventGroups>(DEFAULT_GROUPS);
  const [sizes, setSizes] = useState<Record<string, number>>({});
  const record = (key: string) => (bytes: number) =>
    setSizes((current) => (current[key] === bytes ? current : { ...current, [key]: bytes }));
  const kb = (key: string) => (sizes[key] ? `${fa(Math.round(sizes[key] / 1024))}KB` : "…");

  return (
    <div className="mx-auto max-w-[1240px] px-4 py-10 sm:px-8">
      <h1 className="text-sm font-semibold">سندباکس · پس‌زمینهٔ کارت روز</h1>
      <p className="mt-1 max-w-3xl text-[0.6875rem] leading-5 text-muted">
        همه با رندرکنندهٔ نهایی و دادهٔ واقعی امروز کشیده شده‌اند. عکس‌ها عمداً خیلی محو شده‌اند
        و یک لایهٔ تیره رویشان است، تا رنگ و بافت بدهند بدون اینکه متن را خراب کنند. پیش‌نمایش‌ها
        یک‌سوم اندازه‌اند؛ حجمی که زیر هرکدام نوشته شده حجم فایل واقعیِ تمام‌اندازه است و دکمهٔ
        «ذخیره» هم همان را می‌دهد.
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        {([["پیش‌فرض", DEFAULT_GROUPS], ["همهٔ دسته‌ها", ALL_GROUPS]] as const).map(([label, value]) => (
          <button key={label} aria-pressed={groups === value} onClick={() => setGroups(value)}
            className={`rounded-lg px-3 py-1.5 text-[0.6875rem] ${groups === value ? "bg-leaf font-medium text-forest" : "text-muted hover:bg-paper"}`}>{label}</button>
        ))}
        <span className="text-[0.625rem] text-muted">{formatDate(now, "persian", true)}</span>
      </div>

      <h2 className="mt-8 mb-3 text-xs font-semibold">پالت‌ها · {fa(PALETTES.length)} تا</h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {PALETTES.map((palette) => (
          <section key={palette.id}>
            <Card now={now} groups={groups} colours={palette.colours} label={palette.id} onSize={record(palette.id)} />
            <p className="mt-1 text-[0.625rem] text-muted">{palette.label} · <span className="text-clay">{kb(palette.id)}</span></p>
          </section>
        ))}
      </div>

      <h2 className="mt-10 mb-3 text-xs font-semibold">عکس‌ها · {fa(backgrounds.length)} تا</h2>
      {backgrounds.length === 0 ? (
        <p className="text-xs text-muted">پوشهٔ public/backgrounds خالی است یا خوانده نشد.</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {backgrounds.map((photo) => (
            <section key={photo.id}>
              <Card now={now} groups={groups} colours={PHOTO_COLOURS} photo={photo} label={photo.id} onSize={record(photo.id)} />
              <p className="mt-1 truncate text-[0.625rem] text-muted" title={photo.id}>{photo.id} · <span className="text-clay">{kb(photo.id)}</span></p>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
