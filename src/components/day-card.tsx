// ============================================================================
// Source: src/components/day-card.tsx
// Version: 0.2.0 — 2026-09-09
// Why: Draws one day as an image the visitor can save and send. Canvas, in
//      their own browser — nothing is uploaded and no server renders anything.
// Env / Deps: lib/day-card decides the content; this file only draws it.
//      Colours are hex here and nowhere else in a component: a canvas cannot
//      read a CSS variable, and the card is an exported image rather than
//      themed UI. Keep PALETTE equal to the tokens it names, the same rule
//      scripts/build-og already follows.
// ============================================================================

"use client";

import { CARD_SOURCE, cardFilename, cardOccasions, dayCard, type DayCard } from "@/lib/day-card";
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

// One card, chosen by Farjad on 9 Sep from three in a sandbox: the green square. Square is
// what shows whole in Telegram, WhatsApp and Instagram, and the green is the hero's own, so
// the card looks like the product rather than like a generic image.
export const CARD_SIZE = 1080;

// The card's own font. Vazirmatn is the app's default and the only face guaranteed to be
// there whatever the visitor picked, so the image looks the same for everyone.
const FONT = "Vazirmatn";
const font = (weight: number, size: number) => `${weight} ${size}px ${FONT}, sans-serif`;

/** Canvas needs each face at each weight loaded before it will use it rather than a fallback. */
export async function loadCardFont(): Promise<void> {
  if (typeof document === "undefined" || !document.fonts) return;
  await Promise.all([300, 400, 600, 700].map((weight) => document.fonts.load(font(weight, 64))));
}

export function drawDayCard(canvas: HTMLCanvasElement, card: DayCard): void {
  const size = CARD_SIZE;
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  ctx.fillStyle = PALETTE.forestDeep;
  ctx.fillRect(0, 0, size, size);

  // Persian is laid out right to left; the browser's own shaper does the joining, which is
  // why this is a canvas and not the satori renderer the social image had to abandon.
  ctx.direction = "rtl";
  ctx.textAlign = "right";
  ctx.textBaseline = "alphabetic";

  const pad = 96;
  const right = size - pad;

  ctx.fillStyle = PALETTE.onDarkMuted;
  ctx.font = font(400, 40);
  ctx.fillText(card.weekday, right, pad + 48);

  // The date itself, the one thing the card exists for.
  ctx.fillStyle = "#ffffff";
  ctx.font = font(700, 150);
  ctx.fillText(`${card.day} ${card.month}`, right, pad + 200);
  ctx.fillStyle = PALETTE.onDarkMuted;
  ctx.font = font(300, 88);
  ctx.fillText(card.year, right, pad + 305);

  const ruleY = pad + 360;
  ctx.strokeStyle = "rgba(255,255,255,0.18)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(pad, ruleY);
  ctx.lineTo(right, ruleY);
  ctx.stroke();

  ctx.fillStyle = PALETTE.onDarkMuted;
  ctx.font = font(400, 34);
  ctx.fillText(card.islamic, right, ruleY + 56);
  // Gregorian is Latin and runs the other way, so it is drawn from the left edge.
  ctx.direction = "ltr";
  ctx.textAlign = "left";
  ctx.fillText(card.gregorian, pad, ruleY + 56);
  ctx.direction = "rtl";
  ctx.textAlign = "right";

  // Occasions, capped. A card that cannot hold them all says how many it left.
  const { lines, hidden } = cardOccasions(card);
  let y = ruleY + 170;
  ctx.font = font(600, 44);
  for (const line of lines) {
    // The dark counterpart of clay: the light-theme value is unreadable on this green.
    ctx.fillStyle = card.holiday ? PALETTE.clayOnDark : PALETTE.onDark;
    ctx.fillText(line, right, y);
    y += 62;
  }
  if (hidden > 0) {
    ctx.fillStyle = PALETTE.onDarkMuted;
    ctx.font = font(400, 34);
    ctx.fillText(`و ${hidden} مناسبت دیگر`, right, y);
  }
  if (lines.length === 0) {
    ctx.fillStyle = PALETTE.onDarkMuted;
    ctx.font = font(400, 36);
    ctx.fillText("مناسبتی برای این روز ثبت نشده.", right, y);
  }

  // The source, because a card outlives the page it came from.
  ctx.fillStyle = PALETTE.onDarkMuted;
  ctx.font = font(400, 32);
  ctx.direction = "ltr";
  ctx.textAlign = "left";
  ctx.fillText(CARD_SOURCE, pad, size - pad + 8);
}

/**
 * Renders the card off-screen and hands it over: the share sheet where the browser has one —
 * which is what someone on a phone actually wants, since «send it to Telegram» is the point —
 * and a download everywhere else.
 */
export async function shareDayCard(now: Date, groups: EventGroups): Promise<"shared" | "saved" | "cancelled"> {
  await loadCardFont();
  const canvas = document.createElement("canvas");
  drawDayCard(canvas, dayCard(now, groups));
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
  if (!blob) throw new Error("card render failed");
  const name = cardFilename(now);
  const file = new File([blob], name, { type: "image/png" });
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file] });
      return "shared";
    } catch (thrown) {
      // Dismissing the sheet is not a failure and must not be reported as one.
      if (thrown instanceof DOMException && thrown.name === "AbortError") return "cancelled";
      // Anything else falls through to a download rather than leaving them with nothing.
    }
  }
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  URL.revokeObjectURL(url);
  return "saved";
}
