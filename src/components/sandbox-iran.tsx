// ============================================================================
// Source: src/components/sandbox-iran.tsx
// Version: 0.1.0 — 2026-09-11
// Why: SANDBOX. The hero card with its current sunrise and four pre-Islamic
//      motifs in its place: Persepolis merlons, the twelve-petal Persepolis
//      rosette, a Sasanian pearl roundel, and the Apadana cypress row. Each is
//      drawn in currentColor, so it follows the accent (the live sunrise is
//      hard-coded sage #b7c7a6 and stays green under pink or lapis), and each is
//      shown on all four accents with its measured weight.
//      Delete with src/app/sandbox/iran once Farjad has picked.
// Env / Deps: Client component, only to measure the drawings after render.
//      The accent is set per tile as a CSS variable — the only way to scope one
//      token to one element — hence the style attribute.
// ============================================================================

"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";

// The light «forest-deep» of each accent: the hero's own background.
const ACCENT_DEEP = [
  { id: "green", label: "سبز", deep: "#214f40" },
  { id: "pink", label: "صورتی", deep: "#a3345f" },
  { id: "turquoise", label: "فیروزه‌ای", deep: "#0f6b6e" },
  { id: "lapis", label: "لاجوردی", deep: "#26418f" },
] as const;

const range = (n: number) => Array.from({ length: n }, (_, i) => i);

// The live drawing, verbatim except for the colour.
function Sunrise() {
  return (
    <svg viewBox="0 0 250 240" fill="none" aria-hidden="true" className="pointer-events-none absolute -bottom-10 left-2 h-64 w-64 opacity-35 sm:left-8">
      <path d="M30 232V121a95 95 0 0 1 190 0v111M43 232V121a82 82 0 0 1 164 0v111M56 232V121a69 69 0 0 1 138 0v111" stroke="currentColor" strokeWidth=".8" />
      <circle cx="125" cy="120" r="30" stroke="currentColor" />
      <circle cx="125" cy="120" r="24" stroke="currentColor" strokeDasharray="1 4" />
      {range(16).map((i) => <path key={i} d="M125 78v-12m-3 8 3 4 3-4" stroke="currentColor" strokeWidth=".8" transform={`rotate(${i * 22.5} 125 120)`} />)}
      <path d="M18 176h214M18 185h214M18 194h214M80 219l45-19 45 19m-77 6 32-14 32 14" stroke="currentColor" strokeWidth=".8" />
    </svg>
  );
}

// A: the stepped merlons that crown the Persepolis stairways, along the top edge,
// with a band of small eight-petal rosettes along the bottom, as on the Apadana stairs.
function Merlons() {
  return (
    <>
      <svg aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-7 w-full opacity-30">
        <defs>
          <pattern id="merlon" width="28" height="28" patternUnits="userSpaceOnUse">
            <path d="M3 28V20h4v-7h4V5h6v8h4v7h4v8" fill="none" stroke="currentColor" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#merlon)" />
      </svg>
      <svg aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-3 h-6 w-full opacity-30">
        <defs>
          <pattern id="rosette-band" width="24" height="24" patternUnits="userSpaceOnUse">
            {range(8).map((i) => <ellipse key={i} cx="12" cy="7" rx="1.8" ry="4.2" fill="none" stroke="currentColor" strokeWidth=".7" transform={`rotate(${i * 45} 12 12)`} />)}
            <circle cx="12" cy="12" r="1.4" fill="currentColor" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#rosette-band)" />
      </svg>
    </>
  );
}

// B: the twelve-petal rosette of Persepolis, in the sunrise's place and at its size.
function Rosette() {
  return (
    <svg viewBox="0 0 250 240" fill="none" aria-hidden="true" className="pointer-events-none absolute -bottom-10 left-2 h-64 w-64 opacity-35 sm:left-8">
      <g stroke="currentColor" strokeWidth=".8">
        {range(12).map((i) => <path key={i} d="M125 120c-9-14-9-30 0-50 9 20 9 36 0 50z" transform={`rotate(${i * 30} 125 120)`} />)}
        {range(12).map((i) => <path key={`in${i}`} d="M125 120c-4-7-4-15 0-24 4 9 4 17 0 24z" transform={`rotate(${i * 30 + 15} 125 120)`} />)}
        <circle cx="125" cy="120" r="9" />
        <circle cx="125" cy="120" r="58" />
        <circle cx="125" cy="120" r="64" />
      </g>
      {range(36).map((i) => <circle key={i} cx="125" cy="49" r="1.6" fill="currentColor" transform={`rotate(${i * 10} 125 120)`} />)}
    </svg>
  );
}

// C: the Sasanian pearl roundel — a ring of pearls round a rosette, as on the
// silks and the stuccoes of Ctesiphon — with a string of pearls along the bottom.
function PearlRoundel() {
  return (
    <>
      <svg viewBox="0 0 250 240" fill="none" aria-hidden="true" className="pointer-events-none absolute -bottom-10 left-2 h-64 w-64 opacity-35 sm:left-8">
        <g stroke="currentColor" strokeWidth=".8">
          <circle cx="125" cy="120" r="80" />
          <circle cx="125" cy="120" r="62" />
          {range(8).map((i) => <path key={i} d="M125 120c-7-11-7-24 0-40 7 16 7 29 0 40z" transform={`rotate(${i * 45} 125 120)`} />)}
          <circle cx="125" cy="120" r="7" />
        </g>
        {range(30).map((i) => <circle key={i} cx="125" cy="49" r="4" stroke="currentColor" strokeWidth=".8" transform={`rotate(${i * 12} 125 120)`} />)}
      </svg>
      <svg aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-3 h-3 w-full opacity-30">
        <defs>
          <pattern id="pearls" width="12" height="12" patternUnits="userSpaceOnUse">
            <circle cx="6" cy="6" r="3" fill="none" stroke="currentColor" strokeWidth=".8" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#pearls)" />
      </svg>
    </>
  );
}

// D: the row of cypresses that separates the processions on the Apadana stairs,
// tall and short in turn, standing on the bottom edge.
function Cypresses() {
  return (
    <svg aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-20 w-full opacity-30">
      <defs>
        <pattern id="cypress" width="40" height="80" patternUnits="userSpaceOnUse">
          <path d="M10 80V72M10 72C3 56 4 30 10 8c6 22 7 48 0 64z" fill="none" stroke="currentColor" strokeWidth=".9" />
          <path d="M10 66l-4-5m4-5l-4-5m4-5l-4-5m4-5l-3-4M10 66l4-5m-4-5l4-5m-4-5l4-5m-4-5l3-4" stroke="currentColor" strokeWidth=".5" />
          <path d="M30 80V74M30 74C25 62 26 44 30 28c4 16 5 34 0 46z" fill="none" stroke="currentColor" strokeWidth=".9" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#cypress)" />
    </svg>
  );
}

const VARIANTS: { id: string; label: string; note: string; draw: () => ReactNode }[] = [
  { id: "now", label: "الان — طلوع خورشید", note: "رنگش ثابت سبز است؛ اینجا با رنگ کارت هماهنگ شده.", draw: Sunrise },
  { id: "merlons", label: "الف — کنگرهٔ تخت جمشید", note: "کنگرهٔ پلکانی بالای کارت، نوار گل‌های هشت‌پر پایین.", draw: Merlons },
  { id: "rosette", label: "ب — گل نیلوفر دوازده‌پر", note: "گل تخت جمشید به‌جای خورشید، هم‌اندازهٔ آن.", draw: Rosette },
  { id: "pearls", label: "ج — قاب مروارید ساسانی", note: "حلقهٔ مروارید دور گل، رشتهٔ مروارید پایین کارت.", draw: PearlRoundel },
  { id: "cypress", label: "د — ردیف سرو آپادانا", note: "سروهای بلند و کوتاه روی لبهٔ پایین کارت.", draw: Cypresses },
];

function Hero({ deep, children }: { deep: string; children: ReactNode }) {
  return (
    <div style={{ "--color-forest-deep": deep } as CSSProperties} className="relative isolate overflow-hidden rounded-[1.75rem] bg-forest-deep px-7 py-7 text-white/90">
      <div className="pointer-events-none absolute inset-0 -z-10 text-white">{children}</div>
      <p className="text-xs text-white/75">امروز، جمعه</p>
      <p className="mt-2 text-3xl font-semibold">۲۰ شهریور ۱۴۰۵</p>
      <p className="mt-6 text-4xl font-medium tabular-nums" dir="ltr">۲۱:۰۲:۰۷</p>
      <p className="mt-2 text-xs text-white/75">ساعت ایران · تهران</p>
    </div>
  );
}

// Weight is what the drawing adds to the page: its serialised SVG, in bytes.
function Variant({ variant }: { variant: (typeof VARIANTS)[number] }) {
  const ref = useRef<HTMLDivElement>(null);
  const [stats, setStats] = useState("");
  useEffect(() => {
    const first = ref.current?.querySelector("[data-tile]");
    if (!first) return;
    const svgs = [...first.querySelectorAll("svg")];
    const bytes = svgs.reduce((sum, svg) => sum + new Blob([svg.outerHTML]).size, 0);
    const shapes = svgs.reduce((sum, svg) => sum + svg.querySelectorAll("path,circle,ellipse,rect").length, 0);
    setStats(`${(bytes / 1024).toFixed(1)} KB · ${shapes} شکل`);
  }, []);
  const Draw = variant.draw;
  return (
    <section ref={ref} className="space-y-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-sm font-semibold text-ink">{variant.label}</h2>
        <span className="text-[0.6875rem] tabular-nums text-muted" dir="ltr">{stats}</span>
      </div>
      <p className="text-xs text-muted">{variant.note}</p>
      <div className="grid gap-3 sm:grid-cols-2">
        {ACCENT_DEEP.map((accent) => (
          <div key={accent.id} data-tile>
            <Hero deep={accent.deep}><Draw /></Hero>
            <p className="mt-1 text-[0.6875rem] text-muted">{accent.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export function SandboxIran() {
  return <div className="space-y-10">{VARIANTS.map((variant) => <Variant key={variant.id} variant={variant} />)}</div>;
}
