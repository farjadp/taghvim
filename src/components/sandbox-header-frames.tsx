// ============================================================================
// Source: src/components/sandbox-header-frames.tsx
// Version: 0.1.0 — 2026-09-11
// Why: SANDBOX. Shows each header variant at the phone widths that matter, each
//      in an iframe of that exact width — Tailwind's sm: follows the viewport,
//      so a narrow <div> on a desktop screen would not show the phone layout.
//      Every frame measures itself after load (and again after the fonts have
//      settled): how far the page scrolls sideways, and how tall the header is.
// Env / Deps: /sandbox/header/[variant]. Throwaway.
// ============================================================================

"use client";

import { useState, type SyntheticEvent } from "react";
import { fa } from "@/lib/calendar";
import { HEADER_VARIANTS, type HeaderVariant } from "./sandbox-header";

const WIDTHS = [
  { px: 320, box: "w-[320px]" },
  { px: 360, box: "w-[360px]" },
  { px: 375, box: "w-[375px]" },
  { px: 390, box: "w-[390px]" },
] as const;

const NOTES: Record<HeaderVariant, { name: string; note: string }> = {
  now: { name: "همین که الان هست", note: "منو از لبه بیرون می‌زند و کل صفحه به پهلو اسکرول می‌شود." },
  a: { name: "نوار اسکرول‌شونده", note: "پیوندها در نوار خودشان به پهلو اسکرول می‌شوند، نه کل صفحه. پیوند آخر ممکن است پشت لبه بماند." },
  b: { name: "ردیف دوم", note: "روی گوشی پیوندها به ردیف دوم زیر نشان می‌روند و همهٔ پهنا را می‌گیرند. سربرگ بلندتر می‌شود." },
  c: { name: "دکمهٔ «صفحه‌ها»", note: "روی گوشی پیوندها در یک دکمه جمع می‌شوند. برای رسیدن به هر صفحه یک ضربهٔ اضافه لازم است." },
};

type Fit = { sideways: number; header: number };

function Frame({ variant, px, box }: { variant: HeaderVariant; px: number; box: string }) {
  const [fit, setFit] = useState<Fit | null>(null);
  function measure(event: SyntheticEvent<HTMLIFrameElement>) {
    const frame = event.currentTarget;
    const read = () => {
      const doc = frame.contentDocument;
      if (!doc) return;
      const root = doc.documentElement;
      setFit({
        sideways: Math.max(0, Math.round(root.scrollWidth - root.clientWidth)),
        header: Math.round(doc.querySelector("header")?.getBoundingClientRect().height ?? 0),
      });
    };
    read();
    setTimeout(read, 1200);
  }
  return (
    <figure className="flex shrink-0 flex-col gap-1.5" data-variant={variant} data-width={px}>
      <iframe src={`/sandbox/header/${variant}`} title={`${NOTES[variant].name}، ${px}px`} onLoad={measure} className={`${box} h-[190px] rounded-xl border border-line bg-paper`} />
      <figcaption className="text-[0.6875rem] text-muted">
        <span dir="ltr" className="[unicode-bidi:isolate]">{px}px</span>
        {fit && (
          <span data-sideways={fit.sideways} className={`ms-2 font-medium ${fit.sideways > 0 ? "text-clay" : "text-forest"}`}>
            {fit.sideways > 0 ? `${fa(fit.sideways)}px به پهلو` : "جا می‌شود"}
            <span className="text-muted"> · بلندی سربرگ {fa(fit.header)}px</span>
          </span>
        )}
      </figcaption>
    </figure>
  );
}

export function SandboxHeaderFrames() {
  return (
    <main className="mx-auto max-w-[1760px] px-5 py-10">
      <h1 className="text-2xl font-bold">سندباکس سربرگ</h1>
      <p className="mt-2 max-w-3xl text-sm text-muted">
        سربرگ صفحه‌های دریافت، راهنما، درباره، تغییرات، تماس و تعطیلات پیوسته روی گوشی جا نمی‌شود. هر گزینه در پهنای واقعی چند گوشی کشیده شده و زیر هر قاب اندازه‌گیری خود صفحه آمده است. روی کامپیوتر هر چهار یکی‌اند.
      </p>
      {HEADER_VARIANTS.map((variant) => (
        <section key={variant} className="mt-10">
          <h2 className="text-lg font-bold">
            <span className="text-forest">{variant === "now" ? "فعلی" : variant.toUpperCase()}</span> · {NOTES[variant].name}
          </h2>
          <p className="mt-1 text-xs text-muted">{NOTES[variant].note}</p>
          <div className="mt-4 flex gap-5 overflow-x-auto pb-2">
            {WIDTHS.map(({ px, box }) => <Frame key={px} variant={variant} px={px} box={box} />)}
          </div>
        </section>
      ))}
    </main>
  );
}
