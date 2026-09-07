// ============================================================================
// Source: src/components/zodiac-icon.tsx
// Version: 0.8.0 — 2026-09-07
// Why: Draws a zodiac sign as an SVG glyph. Deliberately not the Unicode
//      characters (♈♉♊): those render as colour emoji on some systems, at a
//      size and weight nothing else on the page uses.
// Env / Deps: lucide-react, already a dependency (ISC). The glyphs are
//      stroke-based like every other icon here, so they inherit currentColor
//      and work in both themes without a second asset.
// ============================================================================

import {
  ZodiacAquarius, ZodiacAries, ZodiacCancer, ZodiacCapricorn, ZodiacGemini, ZodiacLeo,
  ZodiacLibra, ZodiacPisces, ZodiacSagittarius, ZodiacScorpio, ZodiacTaurus, ZodiacVirgo,
  type LucideProps,
} from "lucide-react";
import type { Sign } from "@/lib/zodiac";

// Keyed by Sign.latin, so a missing key is a type error rather than a blank box.
const GLYPHS: Record<string, React.ComponentType<LucideProps>> = {
  Aries: ZodiacAries, Taurus: ZodiacTaurus, Gemini: ZodiacGemini, Cancer: ZodiacCancer,
  Leo: ZodiacLeo, Virgo: ZodiacVirgo, Libra: ZodiacLibra, Scorpio: ZodiacScorpio,
  Sagittarius: ZodiacSagittarius, Capricorn: ZodiacCapricorn, Aquarius: ZodiacAquarius, Pisces: ZodiacPisces,
};

export function ZodiacIcon({ sign, ...props }: { sign: Sign } & LucideProps) {
  const Glyph = GLYPHS[sign.latin];
  return <Glyph aria-hidden="true" strokeWidth={1.5} {...props} />;
}
