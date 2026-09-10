// ============================================================================
// Source: src/components/icons/iran-marks.tsx
// Version: 0.2.0 — 2026-09-10
// Why: The mark for «جاویدنامان». lucide has nothing for this, and a full
//      lion-and-sun is heraldry: at 13px — the size the list row draws — the
//      mane, the face and the sword collapse into a smudge. Picked by Farjad
//      from three readings in a sandbox on 10 Sep: the crown, as a silhouette.
//      The other two, a sun and a flag, are deleted with the sandbox.
// Env / Deps: Same contract as a lucide icon — 24×24 viewBox, currentColor,
//      round caps, `size` in px — so it drops into the same icon slot.
//      Every coordinate is a literal: a computed one has to be rounded, or Node
//      and V8 print the tail of the float differently and it hydrates dirty.
// ============================================================================

type MarkProps = { size?: number; className?: string; strokeWidth?: number };

/** The crown, as a silhouette: the imperial mark reduced to what reads at 13px. */
export function CrownMark({ size = 18, className, strokeWidth = 1.7 }: MarkProps) {
  return (
    <svg
      width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"
      className={className} aria-hidden
    >
      <path d="M3.5 9.5 6.8 13l2.7-4.6L12 4.6l2.5 3.8L17.2 13l3.3-3.5-1.3 8.4H4.8z" />
      <path d="M4.4 20.2h15.2" />
    </svg>
  );
}
