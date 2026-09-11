// ============================================================================
// Source: src/components/hero-motifs.tsx
// Version: 0.9.38 — 2026-09-11
// Why: The hero's decorative drawing, in five versions the visitor chooses
//      between: the sunrise, the Persepolis merlons, the twelve-petal Persepolis
//      rosette, the Sasanian pearl roundel, and the Apadana cypress row.
//      Picked from /sandbox/iran on 11 Sep («همشون رو دوست دارم»).
// Env / Deps: All five are rendered and globals.css shows the one named by
//      data-motif on <html>, which the pre-paint boot script sets — so the right
//      drawing is there on first paint, with no flash and no hydration mismatch.
//      Every stroke is currentColor: the drawing follows the hero's white text
//      on every accent (the old sunrise was hard-coded sage and stayed green).
//      Pattern ids are prefixed «hero-»: there is one hero per page.
//      ~15 KB of inline SVG in total, measured in the sandbox.
// ============================================================================

import type { Motif } from "@/lib/preferences";

const range = (n: number) => Array.from({ length: n }, (_, i) => i);
// The corner drawings share the sunrise's box, so each replaces it at its size.
const CORNER = "pointer-events-none absolute -bottom-10 left-2 h-64 w-64 opacity-35 sm:left-8";

function Sunrise() {
  return (
    <svg viewBox="0 0 250 240" fill="none" aria-hidden="true" className={CORNER}>
      <path d="M30 232V121a95 95 0 0 1 190 0v111M43 232V121a82 82 0 0 1 164 0v111M56 232V121a69 69 0 0 1 138 0v111" stroke="currentColor" strokeWidth=".8" />
      <circle cx="125" cy="120" r="30" stroke="currentColor" />
      <circle cx="125" cy="120" r="24" stroke="currentColor" strokeDasharray="1 4" />
      {range(16).map((i) => <path key={i} d="M125 78v-12m-3 8 3 4 3-4" stroke="currentColor" strokeWidth=".8" transform={`rotate(${i * 22.5} 125 120)`} />)}
      <path d="M18 176h214M18 185h214M18 194h214M80 219l45-19 45 19m-77 6 32-14 32 14" stroke="currentColor" strokeWidth=".8" />
    </svg>
  );
}

// The stepped merlons that crown the Persepolis stairways along the top edge, and a
// band of eight-petal rosettes along the bottom, as on the Apadana stairs.
function Merlons() {
  return (
    <>
      <svg aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-7 w-full opacity-30">
        <defs>
          <pattern id="hero-merlon" width="28" height="28" patternUnits="userSpaceOnUse">
            <path d="M3 28V20h4v-7h4V5h6v8h4v7h4v8" fill="none" stroke="currentColor" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#hero-merlon)" />
      </svg>
      <svg aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-3 h-6 w-full opacity-30">
        <defs>
          <pattern id="hero-rosette-band" width="24" height="24" patternUnits="userSpaceOnUse">
            {range(8).map((i) => <ellipse key={i} cx="12" cy="7" rx="1.8" ry="4.2" fill="none" stroke="currentColor" strokeWidth=".7" transform={`rotate(${i * 45} 12 12)`} />)}
            <circle cx="12" cy="12" r="1.4" fill="currentColor" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#hero-rosette-band)" />
      </svg>
    </>
  );
}

// The twelve-petal rosette of Persepolis.
function Rosette() {
  return (
    <svg viewBox="0 0 250 240" fill="none" aria-hidden="true" className={CORNER}>
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

// The Sasanian pearl roundel round a rosette, and a string of pearls along the bottom.
function PearlRoundel() {
  return (
    <>
      <svg viewBox="0 0 250 240" fill="none" aria-hidden="true" className={CORNER}>
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
          <pattern id="hero-pearls" width="12" height="12" patternUnits="userSpaceOnUse">
            <circle cx="6" cy="6" r="3" fill="none" stroke="currentColor" strokeWidth=".8" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#hero-pearls)" />
      </svg>
    </>
  );
}

// The row of cypresses between the processions on the Apadana stairs, tall and short in turn.
function Cypresses() {
  return (
    <svg aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-20 w-full opacity-30">
      <defs>
        <pattern id="hero-cypress" width="40" height="80" patternUnits="userSpaceOnUse">
          <path d="M10 80V72M10 72C3 56 4 30 10 8c6 22 7 48 0 64z" fill="none" stroke="currentColor" strokeWidth=".9" />
          <path d="M10 66l-4-5m4-5l-4-5m4-5l-4-5m4-5l-3-4M10 66l4-5m-4-5l4-5m-4-5l4-5m-4-5l3-4" stroke="currentColor" strokeWidth=".5" />
          <path d="M30 80V74M30 74C25 62 26 44 30 28c4 16 5 34 0 46z" fill="none" stroke="currentColor" strokeWidth=".9" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#hero-cypress)" />
    </svg>
  );
}

// Keyed by the preference value; a test checks every Motif has a drawing and a CSS rule.
export const MOTIF_DRAWINGS: Record<Motif, () => React.ReactNode> = {
  sun: Sunrise,
  merlons: Merlons,
  rosette: Rosette,
  pearls: PearlRoundel,
  cypress: Cypresses,
};

export function HeroMotifs() {
  return (
    <>
      {(Object.entries(MOTIF_DRAWINGS) as [Motif, () => React.ReactNode][]).map(([motif, Draw]) => (
        <div key={motif} data-motif-art={motif} className="absolute inset-0"><Draw /></div>
      ))}
    </>
  );
}
