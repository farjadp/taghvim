// ============================================================================
// Source: scripts/import-official-lunar.mjs
// Version: 0.1.0 — 2026-09-11
// Why: Turns Farjad's persian_holiday.db into src/data/official-lunar.json:
//      for each Persian year, the Persian month-day of every lunar holiday,
//      keyed to its Hijri month-day. Only the holiday rows carrying a
//      «[ day month ]» Hijri tag are read; the month-summary rows (every
//      event of a month glued into one, 412 of them wrongly flagged as a
//      holiday) are skipped by length.
// Env / Deps: sqlite3 CLI. Usage: node scripts/import-official-lunar.mjs <db>
// ============================================================================

import { execFileSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';

const db = process.argv[2];
if (!db) { console.error('usage: node scripts/import-official-lunar.mjs <persian_holiday.db>'); process.exit(1); }

const HIJRI_MONTHS = { 'محرم': 1, 'صفر': 2, 'ربیع الاول': 3, 'ربیع الثانی': 4, 'جمادی الاول': 5, 'جمادی الثانیه': 6, 'رجب': 7, 'شعبان': 8, 'رمضان': 9, 'شوال': 10, 'ذوالقعده': 11, 'ذوالحجه': 12 };
const faDigits = (s) => s.replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)));

const rows = execFileSync('sqlite3', ['-separator', '\t', db,
  "select year, month, day, event from events where is_holiday = 1 and length(event) < 200 and year >= 1400 and event like '%[ %' and event not like '%March%' order by year, month, day"],
  { encoding: 'utf8' }).trim().split('\n');

const out = {};
for (const row of rows) {
  const [year, month, day, event] = row.split('\t');
  const tag = event.match(/\[\s*([۰-۹]+)\s+(.+?)\s*\]/);
  if (!tag) throw new Error(`no Hijri tag: ${row}`);
  const hijriMonth = HIJRI_MONTHS[tag[2]];
  if (!hijriMonth) throw new Error(`unknown Hijri month «${tag[2]}»: ${row}`);
  (out[year] ??= {})[`${month}-${day}`] = `${hijriMonth}-${faDigits(tag[1])}`;
}

writeFileSync('src/data/official-lunar.json', JSON.stringify(out, null, 1) + '\n');
console.log(Object.entries(out).map(([y, days]) => `${y}:${Object.keys(days).length}`).join(' '));
