// ============================================================================
// Source: scripts/build-icons.mjs
// Version: 0.9.9 — 2026-09-08
// Why: The brand mark only exists as src/app/icon.svg, and installed-app icons
//      must be PNG: Android needs 192 and 512, iOS reads apple-icon.png and
//      ignores the manifest, and Chrome wants 16/32/48/128 — 128 is also the
//      icon the Web Store listing shows. Rendering them here keeps one source
//      of truth for all of them.
// Env / Deps: sharp (already present via Next's image optimisation). Run with
//      `npm run build:icons` after changing the mark; outputs are committed.
// ============================================================================

import { mkdir, readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const source = await readFile(join(root, 'src/app/icon.svg'));

// The mark's own rays are cream, so it needs the cream surface behind it to read
// at all; --color-paper is that surface. Padding keeps it off the icon's edges.
const BACKGROUND = '#f7f8f4';
// At 16px a 16% inset leaves an 11px glyph, which reads as a smudge in the
// toolbar. Small icons get less breathing room and more mark.
const PADDING = 0.16;
const SMALL_PADDING = 0.06;
const paddingFor = (size) => (size <= 48 ? SMALL_PADDING : PADDING);

const TARGETS = [
  { file: 'public/icon-192.png', size: 192 },
  { file: 'public/icon-512.png', size: 512 },
  { file: 'src/app/apple-icon.png', size: 180 },
  // Chrome: 16 and 32 in the toolbar and tab, 48 on chrome://extensions, 128
  // in the Web Store listing and the install dialog.
  { file: 'public/icon-16.png', size: 16 },
  { file: 'public/icon-32.png', size: 32 },
  { file: 'public/icon-48.png', size: 48 },
  { file: 'public/icon-128.png', size: 128 },
];

// The Android app's icons for Android 7 (API 24–25), which predate adaptive
// icons; from 8 on, res/mipmap-anydpi-v26 draws the vector mark instead. One
// square and one round file per density, 48dp each.
const ANDROID_RES = 'mobile/android/app/app/src/main/res';
const ANDROID_DENSITIES = { mdpi: 48, hdpi: 72, xhdpi: 96, xxhdpi: 144, xxxhdpi: 192 };
for (const [density, size] of Object.entries(ANDROID_DENSITIES)) {
  TARGETS.push({ file: `${ANDROID_RES}/mipmap-${density}/ic_launcher.png`, size });
  TARGETS.push({ file: `${ANDROID_RES}/mipmap-${density}/ic_launcher_round.png`, size, round: true });
}

// The iPhone app: one 1024px icon (iOS draws every smaller size from it, and the
// App Store rejects an icon with an alpha channel, so it is flattened), and the
// launch image Capacitor's storyboard shows, as three identical files. Until
// these were written the app carried Capacitor's own logo.
const IOS_ASSETS = 'mobile/ios/app/App/App/Assets.xcassets';
TARGETS.push({ file: `${IOS_ASSETS}/AppIcon.appiconset/AppIcon-512@2x.png`, size: 1024, opaque: true });

for (const { file, size, round, opaque } of TARGETS) {
  const inner = Math.round(size * (1 - paddingFor(size) * 2));
  const mark = await sharp(source, { density: 512 }).resize(inner, inner).png().toBuffer();
  const out = join(root, file);
  await mkdir(dirname(out), { recursive: true });
  let icon = sharp({ create: { width: size, height: size, channels: 4, background: BACKGROUND } })
    .composite([{ input: mark, gravity: 'centre' }]);
  if (round) {
    // The launcher shows the round file as-is, so the circle is cut here.
    const circle = Buffer.from(`<svg width="${size}" height="${size}"><circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}"/></svg>`);
    icon = sharp(await icon.png().toBuffer()).composite([{ input: circle, blend: 'dest-in' }]);
  }
  if (opaque) icon = sharp(await icon.png().toBuffer()).flatten({ background: BACKGROUND }).removeAlpha();
  await icon.png().toFile(out);
  console.log(`wrote ${file} (${size}x${size})`);
}

// The iOS launch image: paper, with the mark at a sixth of the width in the middle
// — the storyboard scales it to fill, so a large mark would be cropped on a phone.
const SPLASH = 2732;
const splashMark = await sharp(source, { density: 1024 }).resize(Math.round(SPLASH / 6)).png().toBuffer();
const splash = await sharp({ create: { width: SPLASH, height: SPLASH, channels: 3, background: BACKGROUND } })
  .composite([{ input: splashMark, gravity: 'centre' }])
  .png()
  .toBuffer();
for (const name of ['splash-2732x2732.png', 'splash-2732x2732-1.png', 'splash-2732x2732-2.png']) {
  const out = join(root, `${IOS_ASSETS}/Splash.imageset/${name}`);
  await mkdir(dirname(out), { recursive: true });
  await sharp(splash).toFile(out);
  console.log(`wrote ${IOS_ASSETS}/Splash.imageset/${name} (${SPLASH}x${SPLASH})`);
}
