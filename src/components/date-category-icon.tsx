// ============================================================================
// Source: src/components/date-category-icon.tsx
// Version: 0.1.0 — 2026-09-10
// Why: The icon for each personal-date category, and the colour pair it wears.
//      Kept out of lib/date-categories so the arithmetic there stays free of
//      React, and out of dates-tool so the calendar grid can wear the same mark.
// Env / Deps: lucide for thirteen of them; icons/iran-marks for «جاویدنامان»,
//      which lucide has nothing for. Colours come through CSS variables from
//      globals.css, never as hex — a category has to change with the theme.
// ============================================================================

import {
  Banknote, BookOpen, Briefcase, Cake, Droplet, Dumbbell, Heart, House, PartyPopper,
  Plane, ShoppingBag, Sparkles, Stethoscope, type LucideIcon,
} from "lucide-react";
import { CrownMark } from "./icons/iran-marks";
import { categoryInk, categoryTint, type CategoryId } from "@/lib/date-categories";

type Mark = LucideIcon | ((props: { size?: number; className?: string }) => React.ReactElement);

// «جاویدنامان» carries the crown rather than a lucide glyph — Farjad's pick from three.
const ICONS: Record<CategoryId, Mark> = {
  birthday: Cake,
  love: Heart,
  anniversary: Sparkles,
  memorial: CrownMark,
  joy: PartyPopper,
  period: Droplet,
  instalment: Banknote,
  shopping: ShoppingBag,
  work: Briefcase,
  travel: Plane,
  health: Stethoscope,
  study: BookOpen,
  sport: Dumbbell,
  home: House,
};

export function CategoryIcon({ id, size = 18, className }: { id: CategoryId; size?: number; className?: string }) {
  const Icon = ICONS[id];
  return <Icon size={size} className={className} />;
}

/** The inline style a category wears: its own ink, on its own tint. */
export function categoryStyle(id: CategoryId): React.CSSProperties {
  return { color: categoryInk(id), backgroundColor: categoryTint(id) };
}

export function categoryInkStyle(id: CategoryId): React.CSSProperties {
  return { color: categoryInk(id) };
}
