// ============================================================================
// Source: scripts/sync-javidnaman.mjs
// Version: 0.3.0 — 2026-09-07
// Why: Refreshes src/data/javidnaman.json from javidnaman.iranintl.com. The
//      site embeds its full list in the map page; there is no public API.
//      Run by hand (`npm run sync:javidnaman`) — never at build or request time.
// Env / Deps: Node 18+ global fetch. No dependencies. Network access required.
// ============================================================================

import { writeFile } from "node:fs/promises";

const SOURCE = "https://javidnaman.iranintl.com/";
const OUT = new URL("../src/data/javidnaman.json", import.meta.url);
// Records live inside escaped RSC payload: {\"_id\":\"…\",\"age\":…,\"hasProfileImage\":…,\"name\":\"…\",\"place\":…}
const RECORD = /\{\\"_id\\":\\"([^"\\]+)\\",\\"age\\":(null|\d+),\\"hasProfileImage\\":(true|false),\\"name\\":\\"([^"\\]*)\\",\\"place\\":(null|\\"[^"\\]*\\")\}/g;
// Entries that are editorial placeholders rather than a person's name
const PLACEHOLDER = /نیازمند|جاوید ?نامان|ناشناس|\//;

const html = await (await fetch(SOURCE, { headers: { "user-agent": "taghvim-sync/1.0 (+https://taghv.im)" } })).text();
const seen = new Set();
const people = [];
for (const [, id, age, hasPhoto, name, place] of html.matchAll(RECORD)) {
  if (seen.has(id) || PLACEHOLDER.test(name)) continue;
  seen.add(id);
  people.push({
    id,
    name: name.trim(),
    age: age === "null" ? null : Number(age),
    place: place === "null" ? null : place.slice(2, -2).trim(),
    photo: hasPhoto === "true",
  });
}
if (people.length < 1000) throw new Error(`Only ${people.length} records parsed — the page format probably changed.`);
people.sort((a, b) => a.id.localeCompare(b.id));
await writeFile(OUT, JSON.stringify({ source: SOURCE + "memorial", fetchedAt: new Date().toISOString().slice(0, 10), count: people.length, people }, null, 0) + "\n");
console.log(`${people.length} names written (${people.filter((p) => p.photo).length} with photo).`);
