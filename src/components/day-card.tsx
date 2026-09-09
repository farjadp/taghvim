// ============================================================================
// Source: src/components/day-card.tsx
// Version: 0.1.0 — 2026-09-09
// Why: Draws one day as an image the visitor can save and send. Canvas, in
//      their own browser — nothing is uploaded and no server renders anything.
// Env / Deps: lib/day-card decides the content; this file only draws it.
//      Colours are hex here and nowhere else in a component: a canvas cannot
//      read a CSS variable, and the card is an exported image rather than
//      themed UI. Keep PALETTE equal to the tokens it names, the same rule
//      scripts/build-og already follows.
// ============================================================================

"use client";

import { useEffect, useRef, useState } from "react";
import { Download, ImageDown } from "lucide-react";
import { cardFilename, cardOccasions, dayCard, type DayCard } from "@/lib/day-card";
import { CARD_SOURCE } from "@/lib/day-card";
import { type EventGroups } from "@/lib/events";

// Each equal to the token it names in globals.css.
const PALETTE = {
  paper: "#f7f8f4",     // --color-paper
  surface: "#ffffff",   // --color-surface
  ink: "#243e34",       // --color-ink
  muted: "#5c6a61",     // --color-muted
  forestDeep: "#214f40",// --color-forest-deep
  leaf: "#eaf0e6",      // --color-leaf
  clay: "#a9503b",      // --color-clay
  onDark: "#e2eadb",    // the hero's own text colour on forest-deep
  onDarkMuted: "#d9e3cf",
  // The dark theme's own clay. #a9503b is the light-theme value and is unreadable on
  // forest-deep; the card needs the counterpart the rest of the app already has.
  clayOnDark: "#e39a85",
} as const;

export type CardVariant = "dark" | "light" | "wide";

export const VARIANTS: { key: CardVariant; label: string; width: number; height: number }[] = [
  { key: "dark", label: "سبز، مربع", width: 1080, height: 1080 },
  { key: "light", label: "روشن، مربع", width: 1080, height: 1080 },
  { key: "wide", label: "افقی، برای لینک", width: 1200, height: 630 },
];

// The card's own font. Vazirmatn is the app's default and the only face guaranteed to be
// there whatever the visitor picked, so the image looks the same for everyone.
const FONT = "Vazirmatn";
const font = (weight: number, size: number) => `${weight} ${size}px ${FONT}, sans-serif`;

/** Canvas needs each face at each weight loaded before it will use it rather than a fallback. */
export async function loadCardFont(): Promise<void> {
  if (typeof document === "undefined" || !document.fonts) return;
  await Promise.all([300, 400, 600, 700].map((weight) => document.fonts.load(font(weight, 64))));
}

export function drawDayCard(canvas: HTMLCanvasElement, card: DayCard, variant: CardVariant): void {
  const spec = VARIANTS.find((item) => item.key === variant) ?? VARIANTS[0];
  const { width, height } = spec;
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const dark = variant === "dark";
  const background = dark ? PALETTE.forestDeep : PALETTE.paper;
  const primary = dark ? "#ffffff" : PALETTE.ink;
  const secondary = dark ? PALETTE.onDarkMuted : PALETTE.muted;
  const accent = dark ? PALETTE.onDark : PALETTE.forestDeep;

  ctx.fillStyle = background;
  ctx.fillRect(0, 0, width, height);

  // Persian is laid out right to left; the browser's own shaper handles the joining, which
  // is why this is a canvas and not the satori renderer the social image had to abandon.
  ctx.direction = "rtl";
  ctx.textAlign = "right";
  ctx.textBaseline = "alphabetic";

  const wide = variant === "wide";
  const pad = wide ? 72 : 96;
  // The wide card is not the square one letterboxed: the date keeps the right half and the
  // occasions move to the left, or half the image is empty.
  const right = width - pad;
  // On the wide card the occasions are right-aligned to the middle; on the square one they
  // share the date's right edge.
  const column = width / 2 - pad / 2;
  const scale = wide ? 0.72 : 1;

  // Weekday
  ctx.fillStyle = secondary;
  ctx.font = font(400, 40 * scale);
  ctx.fillText(card.weekday, right, pad + 48 * scale);

  // The date itself, the one thing the card exists for.
  ctx.fillStyle = primary;
  ctx.font = font(700, 150 * scale);
  const dateLine = `${card.day} ${card.month}`;
  ctx.fillText(dateLine, right, pad + 200 * scale);
  ctx.fillStyle = secondary;
  ctx.font = font(300, 88 * scale);
  ctx.fillText(card.year, right, pad + 305 * scale);

  // Rule
  const ruleY = pad + 360 * scale;
  ctx.strokeStyle = dark ? "rgba(255,255,255,0.18)" : "#e6eae3";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(wide ? column + 24 : pad, ruleY);
  ctx.lineTo(right, ruleY);
  ctx.stroke();

  // The other two calendars, on one line.
  ctx.fillStyle = secondary;
  ctx.font = font(400, 34 * scale);
  ctx.fillText(card.islamic, right, ruleY + 56 * scale);
  // Gregorian is Latin and runs the other way, so it is drawn from the left edge.
  ctx.direction = "ltr";
  ctx.textAlign = "left";
  ctx.fillText(card.gregorian, wide ? column + 24 : pad, ruleY + 56 * scale);
  ctx.direction = "rtl";
  ctx.textAlign = "right";

  // Occasions, capped. A card that cannot hold them all says how many it left.
  const { lines, hidden } = cardOccasions(card, 3);
  // On the wide card they sit beside the date, on the square one under it.
  const occasionRight = wide ? column : right;
  let y = wide ? pad + 96 : ruleY + 170 * scale;
  ctx.font = font(600, 44 * scale);
  for (const line of lines) {
    ctx.fillStyle = card.holiday ? (dark ? PALETTE.clayOnDark : PALETTE.clay) : accent;
    ctx.fillText(line, occasionRight, y);
    y += 62 * scale;
  }
  if (hidden > 0) {
    ctx.fillStyle = secondary;
    ctx.font = font(400, 34 * scale);
    ctx.fillText(`و ${hidden} مناسبت دیگر`, occasionRight, y);
  }
  if (lines.length === 0) {
    ctx.fillStyle = secondary;
    ctx.font = font(400, 36 * scale);
    ctx.fillText("مناسبتی برای این روز ثبت نشده.", occasionRight, y);
  }

  // The source, because a card outlives the page it came from.
  ctx.fillStyle = secondary;
  ctx.font = font(400, 32 * scale);
  ctx.direction = "ltr";
  ctx.textAlign = "left";
  ctx.fillText(CARD_SOURCE, pad, height - pad + 8 * scale);
}

export function DayCardTool({ now, groups, variant = "dark" }: {
  now: Date;
  groups: EventGroups;
  variant?: CardVariant;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);
  const card = dayCard(now, groups);

  useEffect(() => {
    let cancelled = false;
    // Drawn only after the face is loaded; otherwise the first paint is a fallback font and
    // the visitor saves that.
    loadCardFont().then(() => {
      if (cancelled || !ref.current) return;
      drawDayCard(ref.current, card, variant);
      setReady(true);
    });
    return () => { cancelled = true; };
  });

  function download() {
    const canvas = ref.current;
    if (!canvas) return;
    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = cardFilename(now);
      link.click();
      URL.revokeObjectURL(url);
    }, "image/png");
  }

  const spec = VARIANTS.find((item) => item.key === variant) ?? VARIANTS[0];
  return (
    <div>
      <canvas ref={ref} width={spec.width} height={spec.height}
        aria-label={`کارت ${card.weekday} ${card.day} ${card.month} ${card.year}`}
        className="h-auto w-full max-w-md rounded-2xl border border-line" />
      <button type="button" onClick={download} disabled={!ready}
        className="mt-4 flex h-12 items-center gap-2 rounded-xl bg-forest-deep px-5 text-xs font-medium text-white transition-colors hover:bg-[#173d30] disabled:opacity-50">
        <Download size={16} />ذخیرهٔ تصویر
      </button>
    </div>
  );
}

export { ImageDown as DayCardIcon };
