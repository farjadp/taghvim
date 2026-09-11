// ============================================================================
// Source: scripts/build-widget-data.mjs
// Version: 0.1.0 — 2026-09-10
// Why: Writes the two files the native apps are built on, from the web's own
//      code so neither can disagree with the site:
//        mobile/shared/widget-data.json    what eventsForDate says, per day
//        mobile/shared/jalali-vectors.json the dates the Kotlin and Swift
//                                          Jalali ports are tested against
//      Both are committed. src/lib/widget-data.test.ts fails when either file
//      no longer matches what this script would write, so an edit to the event
//      tables cannot reach the web without reaching the widget.
// Env / Deps: Vite's runnerImport, to load the TypeScript modules as they are.
//      Run `npm run build:widget-data` after changing events, month names or
//      WIDGET_YEARS, and commit the output.
// ============================================================================

import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runnerImport } from 'vite';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(root, 'mobile/shared');

const { module } = await runnerImport(join(root, 'src/lib/widget-data.ts'));

// One day or one vector per line: a change to an occasion shows up in a diff as
// the one line it touched, not as a rewrite of a single enormous line.
function write(value, listKey) {
  const { [listKey]: list, ...head } = value;
  const lines = Array.isArray(list)
    ? list.map((item) => JSON.stringify(item))
    : Object.entries(list).map(([key, item]) => `${JSON.stringify(key)}:${JSON.stringify(item)}`);
  const open = Array.isArray(list) ? '[' : '{';
  const close = Array.isArray(list) ? ']' : '}';
  const prefix = JSON.stringify(head).slice(0, -1);
  return `${prefix},${JSON.stringify(listKey)}:${open}\n${lines.join(',\n')}\n${close}}\n`;
}

await mkdir(OUT, { recursive: true });
const data = module.buildWidgetData();
const vectors = module.buildJalaliVectors();
await writeFile(join(OUT, 'widget-data.json'), write(data, 'days'));
await writeFile(join(OUT, 'jalali-vectors.json'), write(vectors, 'days'));
console.log(
  `widget-data.json: ${Object.keys(data.days).length} days with occasions, ${data.years.from}–${data.years.to}\n` +
  `jalali-vectors.json: ${vectors.days.length} consecutive days from ${vectors.start}, ${Object.keys(vectors.nowruz).length} Nowruz dates`,
);
