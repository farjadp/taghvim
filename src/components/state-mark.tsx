// ============================================================================
// Source: src/components/state-mark.tsx
// Version: 0.1.0 — 2026-09-09
// Why: The glyph that precedes every occasion in the `state` category — the
//      Islamic Republic's own commemorations. Farjad's editorial call, 9 Sep.
// Env / Deps: An inline SVG, not an emoji: 💩 renders as a colour bitmap that
//      ignores the theme and the font, and the project's rule is SVG icons
//      everywhere (the zodiac signs are drawn for the same reason).
// ============================================================================

// Three stacked mounds. `currentColor` so it takes the clay of the line it sits on and has
// a dark-mode counterpart for free.
export function StateMark({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" role="img" aria-label="جمهوری اسلامی"
      className={`inline-block size-3.5 shrink-0 align-[-0.15em] ${className}`}>
      <ellipse cx="8" cy="12.1" rx="6.3" ry="2.4" />
      <ellipse cx="8" cy="8.8" rx="4.3" ry="2.1" />
      <ellipse cx="8" cy="6" rx="2.5" ry="1.8" />
    </svg>
  );
}
