// ============================================================================
// Source: src/lib/javidnaman.ts
// Version: 0.3.0 — 2026-09-07
// Why: Memorial data for the home page: one random name from the javidnaman
//      snapshot per request, plus the URL helpers for the source site.
// Env / Deps: src/data/javidnaman.json (refresh with `npm run sync:javidnaman`).
//      Photos are hot-linked from the source's public CDN; nothing is stored here.
// ============================================================================

import snapshot from '../data/javidnaman.json';

export type Person = {
  id: string;
  name: string;
  age: number | null;
  place: string | null;
  photo: boolean;
};

type Snapshot = { source: string; fetchedAt: string; count: number; people: Person[] };

// The JSON is trusted because we generate it; the cast only narrows the inferred shape.
export const JAVIDNAMAN: Snapshot = snapshot as Snapshot;

const IMAGE_CDN = 'https://d1fwhlqkr1vj82.cloudfront.net/image/';
const PERSON_PAGE = 'https://javidnaman.iranintl.com/memorial/';

// Shown under the panel. Keep it: it states what the list is and where it comes from.
export const JAVIDNAMAN_NOTICE = 'نام‌ها و عکس‌ها از فهرست «جاویدنامان» ایران اینترنشنال برداشته شده‌اند و فقط شامل افراد شناسایی‌شده‌اند، نه همهٔ جان‌باختگان. عکس‌ها مستقیماً از سرور همان سایت بارگذاری می‌شوند.';

// Photo URL on the source CDN; `width` is a resize hint the CDN honours.
export function photoUrl(id: string, width = 288): string {
  return `${IMAGE_CDN}${encodeURIComponent(id)}?width=${width}`;
}

// The person's own page on the source site — every name links back to it.
export function personUrl(id: string): string {
  return `${PERSON_PAGE}${encodeURIComponent(id)}`;
}

// One uniformly random person. `random` is injectable so tests are deterministic.
export function pickPerson(random: () => number = Math.random): Person {
  const { people } = JAVIDNAMAN;
  const index = Math.min(people.length - 1, Math.floor(random() * people.length));
  return people[index];
}
