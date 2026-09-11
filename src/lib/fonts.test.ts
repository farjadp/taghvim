// ============================================================================
// Source: src/lib/fonts.test.ts
// Version: 0.1.0 — 2026-09-10
// Why: FONTS lives in TypeScript and the rules that make each one real live in
//      globals.css. Nothing but this connects them, and a font added to one and
//      not the other fails silently — the page keeps rendering, in the wrong face.
// Env / Deps: Vitest reading globals.css as text.
// ============================================================================

import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { DEFAULT_PREFERENCES, FONTS } from './preferences';

const css = readFileSync(new URL('../app/globals.css', import.meta.url), 'utf8');

describe('fonts', () => {
  it('gives every font a sample rule, so the picker can show it in its own face', () => {
    for (const font of FONTS) {
      expect(css, `[data-font-sample="${font.value}"] missing from globals.css`)
        .toContain(`[data-font-sample="${font.value}"]`);
    }
  });

  it('gives every non-default font a rule that applies it to the page', () => {
    for (const font of FONTS) {
      if (font.value === DEFAULT_PREFERENCES.font) continue;
      expect(css, `html[data-font="${font.value}"] missing from globals.css`)
        .toContain(`html[data-font="${font.value}"]`);
    }
  });

  it('declares a face for every family the rules name', () => {
    for (const family of ['Vazirmatn', 'Shabnam', 'Sahel', 'IRANSansX', 'IRANYekanX']) {
      expect(css).toContain(family);
    }
  });
});
