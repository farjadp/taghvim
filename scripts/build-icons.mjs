// ============================================================================
// Source: scripts/build-icons.mjs
// Version: 0.9.1 — 2026-09-08
// Why: The brand mark only exists as src/app/icon.svg, and installed-app icons
//      must be PNG: Android needs 192 and 512, iOS reads apple-icon.png and
//      ignores the manifest. Rendering them here keeps one source of truth.
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
const PADDING = 0.16;

const TARGETS = [
  { file: 'public/icon-192.png', size: 192 },
  { file: 'public/icon-512.png', size: 512 },
  { file: 'src/app/apple-icon.png', size: 180 },
];

for (const { file, size } of TARGETS) {
  const inner = Math.round(size * (1 - PADDING * 2));
  const mark = await sharp(source, { density: 512 }).resize(inner, inner).png().toBuffer();
  const out = join(root, file);
  await mkdir(dirname(out), { recursive: true });
  await sharp({ create: { width: size, height: size, channels: 4, background: BACKGROUND } })
    .composite([{ input: mark, gravity: 'centre' }])
    .png()
    .toFile(out);
  console.log(`wrote ${file} (${size}x${size})`);
}
