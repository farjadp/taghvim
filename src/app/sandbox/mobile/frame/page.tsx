// ============================================================================
// Source: src/app/sandbox/mobile/frame/page.tsx
// Version: 0.9.1-sandbox — 2026-09-08
// Why: SANDBOX. One arrangement of the real home page, rendered inside a 375px
//      iframe so the app's own mobile breakpoints apply and the measurements
//      are the ones a phone actually gets. Nothing is mocked: this is the real
//      CalendarApp with a stylesheet on top.
// Env / Deps: components/calendar-app, lib/javidnaman. Unlinked and noindex.
//      Deleting src/app/sandbox removes this with no other change.
// ============================================================================

import type { Metadata } from "next";
import { CalendarApp } from "@/components/calendar-app";
import { pickPerson } from "@/lib/javidnaman";

export const metadata: Metadata = { robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

// Reordering across the two panels needs them to be siblings, which they are not:
// the hero and the "other calendars" card live inside one section, and the grid
// holds the calendar and the events list. `display: contents` dissolves both
// wrappers so every panel becomes a direct flex item of <main> and `order` works.
// Real implementation would split the components instead — `display: contents`
// can drop a labelled section from the accessibility tree, which is why this is
// a measuring device and not a patch.
const HERO = 'section[aria-label="تاریخ و ساعت امروز"]';

// `display: contents` dissolves a wrapper's BOX but leaves the DOM alone, so the
// panels become flex items of <main> while still being nested — which means the
// order rules must use descendant selectors, not `main > x`. Getting that wrong
// silently gives every variant the same layout.
const HOIST = `
[data-variant] main { display: flex; flex-direction: column; gap: 1.25rem; }
[data-variant] ${HERO}, [data-variant] main > div.grid { display: contents; }
[data-variant] #tools, [data-variant] #memorial, [data-variant] #prayer { margin-top: 0; }
[data-variant] ${HERO} > div:first-child { order: 1; }
[data-variant] #calendar { order: 2; }
[data-variant] [data-testid="other-calendars"] { order: 3; }
[data-variant] main > div.grid > aside { order: 4; }
[data-variant] #tools { order: 5; }
[data-variant] #memorial { order: 6; }
[data-variant] #prayer { order: 7; }
`;

// b keeps the hero on top and only moves the second card below the calendar.
// c puts the month first and everything else under it.
// d keeps the hero first but strips it to the date line, hiding the clock block,
// the second clocks and the footnote — a stand-in for a compact mobile hero.
// 'a' is the baseline and deliberately gets no hoist at all: dissolving the
// wrappers would already change the layout it is meant to be compared against.
const VARIANTS: Record<string, string> = {
  a: ``,
  b: ``,
  c: `[data-variant] #calendar { order: 0; }`,
  // 'd' lands 45px below the fold, so 'e' is the same idea taken far enough:
  // the date drops to one line and the hero loses its generous padding.
  e: `
    [data-variant] ${HERO} > div:first-child > div:nth-child(3),
    [data-variant] ${HERO} > div:first-child > div:nth-child(4),
    [data-variant] ${HERO} > div:first-child > p { display: none; }
    [data-variant] ${HERO} > div:first-child { padding: 1rem 1.5rem; }
    [data-variant] ${HERO} h1 { font-size: 1.5rem; line-height: 2rem; }
    [data-variant] ${HERO} > div:first-child > div:nth-child(2) > div > div:first-child { margin-bottom: 0.25rem; }
  `,
  d: `
    [data-variant] ${HERO} > div:first-child > div:nth-child(3),
    [data-variant] ${HERO} > div:first-child > div:nth-child(4),
    [data-variant] ${HERO} > div:first-child > p { display: none; }
    [data-variant] ${HERO} > div:first-child { padding-top: 1.25rem; padding-bottom: 1.25rem; }
  `,
};

export default async function MobileFramePage({ searchParams }: { searchParams: Promise<{ v?: string }> }) {
  const variant = (await searchParams).v ?? "a";
  return (
    <div data-variant={variant}>
      <style>{(variant === "a" ? "" : HOIST) + (VARIANTS[variant] ?? "")}</style>
      <CalendarApp initialNow={new Date().toISOString()} person={pickPerson()} />
    </div>
  );
}
