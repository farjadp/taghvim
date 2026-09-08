// ============================================================================
// Source: src/lib/routes.test.ts
// Version: 0.9.1 — 2026-09-08
// Why: A sitemap that silently misses a page is worse than none, so the route
//      list is checked against the pages that actually exist on disk, and the
//      origin against metadataBase. Also guards the manifest's icon files.
// Env / Deps: Vitest; reads src/app from the filesystem.
// ============================================================================

import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import manifest from '../app/manifest';
import robots from '../app/robots';
import sitemap from '../app/sitemap';
import { ROUTES, SITE_ORIGIN } from './routes';

const appDir = fileURLToPath(new URL('../app', import.meta.url));
const root = fileURLToPath(new URL('../..', import.meta.url));

// Every page.tsx under src/app is a public route; nested groups do not exist here.
function pageRoutes(dir: string, prefix = ''): string[] {
  const found: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) found.push(...pageRoutes(`${dir}/${entry.name}`, `${prefix}/${entry.name}`));
    else if (entry.name === 'page.tsx') found.push(prefix === '' ? '/' : prefix);
  }
  return found;
}

describe('routes', () => {
  it('lists every page that exists on disk, and no others', () => {
    expect([...ROUTES.map((route) => route.path)].sort()).toEqual(pageRoutes(appDir).sort());
  });

  it('uses the same origin as metadataBase', () => {
    const layout = readFileSync(`${appDir}/layout.tsx`, 'utf8');
    expect(layout).toContain(`new URL("${SITE_ORIGIN}")`);
  });
});

describe('sitemap', () => {
  it('emits one absolute https url per route, with no duplicates', () => {
    const entries = sitemap();
    expect(entries).toHaveLength(ROUTES.length);
    for (const entry of entries) {
      expect(entry.url.startsWith(`${SITE_ORIGIN}/`)).toBe(true);
      expect(() => new URL(entry.url)).not.toThrow();
      expect(new URL(entry.url).protocol).toBe('https:');
    }
    expect(new Set(entries.map((entry) => entry.url)).size).toBe(entries.length);
  });

  it('keeps priorities inside the range crawlers accept', () => {
    for (const entry of sitemap()) {
      expect(entry.priority).toBeGreaterThanOrEqual(0);
      expect(entry.priority).toBeLessThanOrEqual(1);
    }
  });
});

describe('robots', () => {
  it('allows every crawler and points at the sitemap', () => {
    const rules = robots();
    expect(rules.rules).toEqual([{ userAgent: '*', allow: '/' }]);
    expect(rules.sitemap).toBe(`${SITE_ORIGIN}/sitemap.xml`);
  });
});

describe('manifest', () => {
  it('carries what a home-screen install needs, in Persian and RTL', () => {
    const result = manifest();
    expect(result.lang).toBe('fa');
    expect(result.dir).toBe('rtl');
    expect(result.start_url).toBe('/');
    expect(result.display).toBe('standalone');
    expect(result.short_name?.length).toBeGreaterThan(0);
  });

  it('references icon files that are actually committed', () => {
    const icons = manifest().icons ?? [];
    expect(icons.length).toBeGreaterThanOrEqual(2);
    for (const icon of icons) expect(existsSync(`${root}public${icon.src}`)).toBe(true);
    // iOS ignores the manifest and reads this one instead, so it must exist too.
    expect(existsSync(`${appDir}/apple-icon.png`)).toBe(true);
  });

  it('opens on the same surface colour the page paints', () => {
    const css = readFileSync(`${appDir}/globals.css`, 'utf8');
    expect(css).toContain(`--color-paper: ${manifest().background_color};`);
  });
});
