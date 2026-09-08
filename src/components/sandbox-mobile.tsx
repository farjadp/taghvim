// ============================================================================
// Source: src/components/sandbox-mobile.tsx
// Version: 0.9.1-sandbox — 2026-09-08
// Why: SANDBOX. Four arrangements of the home page side by side in 375x812
//      iframes, with the fold drawn where an iPhone 13 cuts the page and the
//      real distance to the month grid measured inside each frame.
// Env / Deps: Reads each same-origin iframe's document. Throwaway; deleting
//      src/app/sandbox and this file removes it with no other change.
// ============================================================================

"use client";

import { useCallback, useState } from "react";

// The exact viewport Playwright's "iPhone 13" device uses, which is what the
// project's own mobile tests run against: 664 is the height a browser actually
// leaves after its chrome, not the device's 844 CSS pixels. Measuring against
// 812 flattered every variant by ~150px.
const WIDTH = 390;
const FOLD = 664;

const VARIANTS = [
  { key: "a", title: "الف · فعلی", note: "هیرو، «تقویم‌های دیگر»، بعد تقویم." },
  { key: "b", title: "ب · «تقویم‌های دیگر» زیر تقویم", note: "هیرو سر جایش؛ فقط کارت دوم پایین می‌رود." },
  { key: "c", title: "ج · تقویم اول", note: "ماه بالای همه‌چیز؛ هیرو زیرش." },
  { key: "d", title: "د · هیروی فشرده", note: "هیرو فقط تاریخ؛ ساعت و ساعت شهرها پنهان." },
  { key: "e", title: "ه · هیروی فشرده‌تر", note: "همان د، با تاریخ یک‌خطی و حاشیهٔ کمتر." },
] as const;

type Measurement = { calendarTop: number; firstCell: number; gridBottom: number; monthFits: boolean };

function Frame({ variant, title, note }: { variant: string; title: string; note: string }) {
  const [size, setSize] = useState<Measurement | null>(null);

  // Same-origin, so the parent can read the frame directly instead of postMessage.
  const measure = useCallback((frame: HTMLIFrameElement | null) => {
    if (!frame) return;
    const read = () => {
      const doc = frame.contentDocument;
      const calendar = doc?.querySelector("#calendar");
      // Scoped to the calendar card: the events panel's filter chips also carry
      // aria-pressed, and picking one of those put "end of month" 1100px too low.
      const cells = doc?.querySelectorAll<HTMLElement>("#calendar [aria-pressed]");
      if (!calendar || !cells?.length) return false;
      const top = (el: Element) => Math.round(el.getBoundingClientRect().top + (frame.contentWindow?.scrollY ?? 0));
      const last = cells[cells.length - 1];
      const gridBottom = top(last) + Math.round(last.getBoundingClientRect().height);
      setSize({
        calendarTop: top(calendar),
        firstCell: top(cells[0]),
        gridBottom,
        monthFits: gridBottom <= FOLD,
      });
      return true;
    };
    // The clock hydrates and the grid settles a beat after load.
    const timer = setInterval(() => { if (read()) clearInterval(timer); }, 250);
    setTimeout(() => clearInterval(timer), 8000);
  }, []);

  return (
    <div className="shrink-0">
      <h2 className="text-sm font-bold text-forest">{title}</h2>
      <p className="mt-1 mb-2 h-8 text-[0.6875rem] leading-4 text-muted">{note}</p>
      <div className="relative" style={{ width: WIDTH }}>
        <iframe
          ref={measure}
          src={`/sandbox/mobile/frame?v=${variant}`}
          title={title}
          width={WIDTH}
          height={FOLD}
          className="block rounded-xl border border-line bg-surface"
        />
        {/* The fold: everything below this line needs a scroll on an iPhone 13 */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 border-b-2 border-dashed border-clay" />
      </div>
      <dl className="mt-3 space-y-1 text-[0.6875rem] text-muted">
        <div className="flex justify-between gap-3"><dt>شروع کارت تقویم</dt><dd className="font-bold tabular-nums text-ink">{size ? `${size.calendarTop}px` : "…"}</dd></div>
        <div className="flex justify-between gap-3"><dt>اولین خانهٔ روز</dt><dd className="font-bold tabular-nums text-ink">{size ? `${size.firstCell}px` : "…"}</dd></div>
        <div className="flex justify-between gap-3"><dt>پایان ماه</dt><dd className="font-bold tabular-nums text-ink">{size ? `${size.gridBottom}px` : "…"}</dd></div>
        <div className="flex justify-between gap-3">
          <dt>ماه کامل در نگاه اول</dt>
          <dd className={`font-bold ${size?.monthFits ? "text-forest" : "text-clay"}`}>{size ? (size.monthFits ? "بله" : "نه") : "…"}</dd>
        </div>
      </dl>
    </div>
  );
}

export function MobileSandbox() {
  return (
    <div className="flex gap-6 overflow-x-auto pb-4">
      {VARIANTS.map((variant) => <Frame key={variant.key} variant={variant.key} title={variant.title} note={variant.note} />)}
    </div>
  );
}
