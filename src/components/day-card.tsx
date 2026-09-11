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
import { DEFAULT_PALETTE, resolveCardStyle, type Background, type CardColours, type CardStyle } from "@/lib/card-style";

// One card, chosen by Farjad on 9 Sep from three in a sandbox: the green square. Square is
// what shows whole in Telegram, WhatsApp and Instagram, and the green is the hero's own, so
// the card looks like the product rather than like a generic image.
export const CARD_SIZE = 1080;

// A photograph is blurred by drawing it into a tiny canvas and blowing that back up. It is
// not `ctx.filter`, which Safari only learned recently, and it is far heavier than any blur
// radius worth typing: the point is colour and texture, not a picture you can read.
const BLUR_WIDTH = 28;
// Over the blur, so white text stays white text whatever the photograph is doing.
const SCRIM = 0.62;

/**
 * A flat palette is a few solid colours and sharp text: PNG, and about 82KB. A blurred
 * photograph is a field of gradients, which is the one thing PNG is worst at — the same card
 * came out between 221KB and 925KB. JPEG at this quality is a quarter of that and the
 * difference is invisible under a scrim.
 */
export function cardFormat(hasPhoto: boolean): { type: string; quality?: number; extension: string } {
  return hasPhoto
    ? { type: "image/jpeg", quality: 0.92, extension: "jpg" }
    : { type: "image/png", extension: "png" };
}

// The card's own font. Vazirmatn is the app's default and the only face guaranteed to be
// there whatever the visitor picked, so the image looks the same for everyone.
const FONT = "Vazirmatn";
const font = (weight: number, size: number) => `${weight} ${size}px ${FONT}, sans-serif`;

/** Canvas needs each face at each weight loaded before it will use it rather than a fallback. */
export async function loadCardFont(): Promise<void> {
  if (typeof document === "undefined" || !document.fonts) return;
  await Promise.all([300, 400, 600, 700].map((weight) => document.fonts.load(font(weight, 64))));
}

export type CardPaint = {
  colours?: CardColours;
  // Already decoded by the caller: drawImage cannot wait for a load.
  photo?: CanvasImageSource;
  // Preview scale. The exported card is always CARD_SIZE; a sandbox draws smaller ones
  // so seventeen of them do not cost seventeen full-size backing stores.
  scale?: number;
};

// Blurs by shrinking and re-expanding, then lays a scrim over it.
function paintPhoto(ctx: CanvasRenderingContext2D, photo: CanvasImageSource, size: number): void {
  const small = document.createElement("canvas");
  small.width = BLUR_WIDTH;
  small.height = BLUR_WIDTH;
  const smallCtx = small.getContext("2d");
  if (!smallCtx) return;
  smallCtx.drawImage(photo, 0, 0, BLUR_WIDTH, BLUR_WIDTH);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(small, 0, 0, size, size);
  ctx.fillStyle = `rgba(15, 22, 19, ${SCRIM})`;
  ctx.fillRect(0, 0, size, size);
}

export function drawDayCard(canvas: HTMLCanvasElement, card: DayCard, paint: CardPaint = {}): void {
  const size = CARD_SIZE;
  const scale = paint.scale ?? 1;
  const colours = paint.colours ?? DEFAULT_PALETTE.colours;
  canvas.width = Math.round(size * scale);
  canvas.height = Math.round(size * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.scale(scale, scale);

  ctx.fillStyle = colours.background;
  ctx.fillRect(0, 0, size, size);
  if (paint.photo) paintPhoto(ctx, paint.photo, size);

  // Persian is laid out right to left; the browser's own shaper does the joining, which is
  // why this is a canvas and not the satori renderer the social image had to abandon.
  ctx.direction = "rtl";
  ctx.textAlign = "right";
  ctx.textBaseline = "alphabetic";

  const pad = 96;
  const right = size - pad;

  ctx.fillStyle = colours.secondary;
  ctx.font = font(400, 40);
  ctx.fillText(card.weekday, right, pad + 48);

  // The date itself, the one thing the card exists for.
  ctx.fillStyle = colours.primary;
  ctx.font = font(700, 150);
  ctx.fillText(`${card.day} ${card.month}`, right, pad + 200);
  ctx.fillStyle = colours.secondary;
  ctx.font = font(300, 88);
  ctx.fillText(card.year, right, pad + 305);

  const ruleY = pad + 360;
  ctx.strokeStyle = colours.rule;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(pad, ruleY);
  ctx.lineTo(right, ruleY);
  ctx.stroke();

  ctx.fillStyle = colours.secondary;
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
    ctx.fillStyle = card.holiday ? colours.holiday : colours.accent;
    ctx.fillText(line, right, y);
    y += 62;
  }
  if (hidden > 0) {
    ctx.fillStyle = colours.secondary;
    ctx.font = font(400, 34);
    ctx.fillText(`و ${hidden} مناسبت دیگر`, right, y);
  }
  if (lines.length === 0) {
    ctx.fillStyle = colours.secondary;
    ctx.font = font(400, 36);
    ctx.fillText("مناسبتی برای این روز ثبت نشده.", right, y);
  }

  // The source, because a card outlives the page it came from.
  ctx.fillStyle = colours.secondary;
  ctx.font = font(400, 32);
  ctx.direction = "ltr";
  ctx.textAlign = "left";
  ctx.fillText(CARD_SOURCE, pad, size - pad + 8);
}

/**
 * Loads one background, or nothing if it will not load — a missing file must not stop a card.
 *
 * `onload`, not `decode()`. decode() resolves when the image is ready to be *painted*, so in a
 * tab that is not being rendered — a background tab, or a headless browser — it simply never
 * settles and the card is never drawn. drawImage only needs the bytes.
 */
export function loadBackground(src: string): Promise<HTMLImageElement | undefined> {
  return new Promise((resolve) => {
    const image = new Image();
    // Same-origin, so the canvas is never tainted and toBlob keeps working.
    image.onload = () => resolve(image);
    image.onerror = () => resolve(undefined);
    image.src = src;
  });
}

/**
 * Renders the card off-screen and hands it over: the share sheet where the browser has one —
 * which is what someone on a phone actually wants, since «send it to Telegram» is the point —
 * and a download everywhere else.
 */
export async function shareDayCard(now: Date, groups: EventGroups, style: CardStyle, backgrounds: Background[], months?: string[]): Promise<"shared" | "saved" | "cancelled"> {
  const { colours, photo } = resolveCardStyle(style, backgrounds);
  const [, image] = await Promise.all([loadCardFont(), photo ? loadBackground(photo.src) : undefined]);
  const canvas = document.createElement("canvas");
  // `months` is optional so a caller with no preference still gets the modern names.
  drawDayCard(canvas, dayCard(now, groups, months), { colours, photo: image });
  const format = cardFormat(Boolean(image));
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, format.type, format.quality));
  if (!blob) throw new Error("card render failed");
  const name = cardFilename(now, format.extension);
  const file = new File([blob], name, { type: format.type });
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
