// ============================================================================
// Source: src/components/icons/iran-marks.tsx
// Version: 0.1.0 — 2026-09-10
// Why: Marks for the «جاویدنامان» category. lucide has nothing for this, and a
//      full lion-and-sun is heraldry: at 18px the mane, the sword and the face
//      collapse into a smudge. These are three readings of it drawn as line art
//      at the size the interface actually uses.
// Env / Deps: Same contract as a lucide icon — 24×24 viewBox, currentColor,
//      round caps, `size` in px — so they drop into the same icon slot.
// ============================================================================

type MarkProps = { size?: number; className?: string; strokeWidth?: number };

const base = (size: number, strokeWidth: number) => ({
  width: size,
  height: size,
  viewBox: "0 0 24 24",
  fill: "none" as const,
  stroke: "currentColor",
  strokeWidth,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
});

/** The sun alone — the half of the emblem that survives being drawn small. */
export function SunMark({ size = 18, className, strokeWidth = 1.7 }: MarkProps) {
  // Rounded, and not by taste: Node and V8 print the tail of a float differently
  // (…5935 against …594), so an unrounded ray hydrates with a mismatch on every
  // page that draws this mark. Three decimals is far finer than a 24-unit viewBox.
  const round = (value: number) => Math.round(value * 1000) / 1000;
  const rays = Array.from({ length: 12 }, (_, index) => {
    const angle = (index * Math.PI) / 6;
    const [x, y] = [Math.cos(angle), Math.sin(angle)];
    return <line key={index}
      x1={round(12 + x * 6.4)} y1={round(12 + y * 6.4)}
      x2={round(12 + x * 9.2)} y2={round(12 + y * 9.2)} />;
  });
  return <svg {...base(size, strokeWidth)} className={className}><circle cx="12" cy="12" r="4.6" />{rays}</svg>;
}

/** The flag: three bands, the sun standing in the middle one. */
export function FlagMark({ size = 18, className, strokeWidth = 1.7 }: MarkProps) {
  return (
    <svg {...base(size, strokeWidth)} className={className}>
      <path d="M4 3v18" />
      <path d="M4 4.5h16v13H4" />
      <path d="M4 8.8h16M4 13.2h16" />
      <circle cx="12" cy="11" r="1.9" />
      <path d="M12 7.6v-.9M12 15.3v-.9M8.6 11h-.9M16.3 11h-.9" />
    </svg>
  );
}

/** The crown, as a silhouette: the imperial mark reduced to what reads at 18px. */
export function CrownMark({ size = 18, className, strokeWidth = 1.7 }: MarkProps) {
  return (
    <svg {...base(size, strokeWidth)} className={className}>
      <path d="M3.5 9.5 6.8 13l2.7-4.6L12 4.6l2.5 3.8L17.2 13l3.3-3.5-1.3 8.4H4.8z" />
      <path d="M4.4 20.2h15.2" />
    </svg>
  );
}
