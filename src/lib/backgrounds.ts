// ============================================================================
// Source: src/lib/backgrounds.ts
// Version: 0.1.0 — 2026-09-09
// Why: Lists the photographs in public/backgrounds. Read from disk rather than
//      from a hand-kept list, so dropping a file into that folder is the whole
//      job — no build step to remember and no manifest to fall out of date.
// Env / Deps: SERVER ONLY. Imports node:fs, so it must never be pulled into a
//      client component; pass the result down as a prop, the way app/page.tsx
//      already passes the memorial pick.
// ============================================================================

import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import type { Background } from './card-style';

const FOLDER = join(process.cwd(), 'public', 'backgrounds');

// Anything a browser will decode. Dotfiles are skipped, which is what keeps .DS_Store out.
const IMAGE = /\.(jpe?g|png|webp|avif)$/i;

// Read once per process. The folder only changes on deploy, and the home page is rendered
// per request — a readdir on every one of those would be work for nothing.
let cached: Background[] | null = null;

/**
 * The photographs available as card backgrounds, in a stable order.
 *
 * The id is the file name. Farjad's files have spaces, Persian, «•» and «…» in them, so the
 * src is percent-encoded — but the id is not, because it is what gets stored in the browser
 * and compared later. Renaming a file therefore drops anyone's stored choice back to the
 * default, which is the honest behaviour: the picture they chose is genuinely gone.
 */
export function listBackgrounds(): Background[] {
  if (cached) return cached;
  try {
    cached = readdirSync(FOLDER)
      .filter((name) => !name.startsWith('.') && IMAGE.test(name))
      .sort((a, b) => a.localeCompare(b, 'fa'))
      .map((name) => ({ id: name, src: `/backgrounds/${encodeURIComponent(name)}` }));
  } catch {
    // No folder, or no permission: the feature is simply absent and the card stays plain.
    cached = [];
  }
  return cached;
}
