// ============================================================================
// Source: scripts/sync-javidnaman.mjs
// Version: 0.4.0 — 2026-09-09
// Why: Refreshes src/data/javidnaman.json from javidnaman.iranintl.com. The
//      site embeds its full list in the map page; there is no public API.
//      Run by hand (`npm run sync:javidnaman`) — never at build or request time.
//      Names arrive with Arabic ي/ك/ى mixed in, so every record is normalised
//      to Persian letters before it is written.
// Env / Deps: Node 18+ global fetch. No dependencies. Network access required.
// ============================================================================

import { writeFile } from "node:fs/promises";

const SOURCE = "https://javidnaman.iranintl.com/";
const OUT = new URL("../src/data/javidnaman.json", import.meta.url);
// Records live inside escaped RSC payload: {\"_id\":\"…\",\"age\":…,\"hasProfileImage\":…,\"name\":\"…\",\"place\":…}
const RECORD = /\{\\"_id\\":\\"([^"\\]+)\\",\\"age\\":(null|\d+),\\"hasProfileImage\\":(true|false),\\"name\\":\\"([^"\\]*)\\",\\"place\\":(null|\\"[^"\\]*\\")\}/g;
// Entries that are editorial placeholders rather than a person's name
const PLACEHOLDER = /نیازمند|جاوید ?نامان|ناشناس|\//;
// The source types some names with Arabic letters. Same sound, different
// codepoint: they render with the wrong final form and never match a Persian
// search. Fold them here, once, so the snapshot is uniformly Persian.
const ARABIC = { "\u064a": "\u06cc", "\u0649": "\u06cc", "\u0643": "\u06a9" };
const fa = (text) => text.replace(/[\u064a\u0649\u0643]/g, (ch) => ARABIC[ch]);

const html = await (await fetch(SOURCE, { headers: { "user-agent": "taghvim-sync/1.0 (+https://taghv.im)" } })).text();
const seen = new Set();
const people = [];
for (const [, id, age, hasPhoto, name, place] of html.matchAll(RECORD)) {
  if (seen.has(id) || PLACEHOLDER.test(name)) continue;
  seen.add(id);
  people.push({
    id,
    name: fa(name.trim()),
    age: age === "null" ? null : Number(age),
    place: place === "null" ? null : fa(place.slice(2, -2).trim()),
    photo: hasPhoto === "true",
  });
}
if (people.length < 1000) throw new Error(`Only ${people.length} records parsed — the page format probably changed.`);
people.sort((a, b) => a.id.localeCompare(b.id));
await writeFile(OUT, JSON.stringify({ source: SOURCE + "memorial", fetchedAt: new Date().toISOString().slice(0, 10), count: people.length, people }, null, 0) + "\n");
console.log(`${people.length} names written (${people.filter((p) => p.photo).length} with photo).`);
