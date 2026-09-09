// ============================================================================
// Source: src/lib/extension.test.ts
// Version: 0.9.15 — 2026-09-09
// Why: The extension's manifest is a promise — no permissions, no remote
//      code — and a promise nobody re-reads. These keep it honest, and keep
//      its version in step with the package so a release cannot ship two
//      different numbers. The Firefox build is the same manifest with a small
//      delta applied, so the delta is checked here too: an AMO upload with no
//      gecko id, or with a Chrome-only key left in, is rejected on submit and
//      that is a slow way to find out.
// Env / Deps: Vitest; reads extension/manifest.json, extension/
//      manifest.firefox.json and package.json.
// ============================================================================

import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const root = fileURLToPath(new URL('../..', import.meta.url));
const manifest = JSON.parse(readFileSync(`${root}extension/manifest.json`, 'utf8'));
const delta = JSON.parse(readFileSync(`${root}extension/manifest.firefox.json`, 'utf8'));
const pkg = JSON.parse(readFileSync(`${root}package.json`, 'utf8'));

// The same merge extension/vite.config.ts does: a null in the delta deletes.
const firefox = { ...manifest };
for (const [key, value] of Object.entries(delta)) {
  if (value === null) delete firefox[key];
  else firefox[key] = value;
}

describe('extension manifest', () => {
  it('is Manifest V3 and overrides only the new tab', () => {
    expect(manifest.manifest_version).toBe(3);
    expect(manifest.chrome_url_overrides).toEqual({ newtab: 'newtab.html' });
    expect(manifest.background).toBeUndefined();
    expect(manifest.content_scripts).toBeUndefined();
  });

  it('asks for no permissions and no hosts', () => {
    expect(manifest.permissions).toEqual([]);
    expect(manifest.host_permissions).toEqual([]);
    expect(manifest.optional_permissions).toBeUndefined();
  });

  // The MV3 default CSP is what forbids inline and remote scripts; loosening
  // it is how "no remote code" quietly stops being true.
  it('keeps the default content security policy', () => {
    expect(manifest.content_security_policy).toBeUndefined();
  });

  it('points at icons that exist in public/', () => {
    for (const file of Object.values(manifest.icons) as string[]) {
      expect(existsSync(`${root}public/${file}`), file).toBe(true);
    }
  });

  it('carries the package version, so one release has one number', () => {
    expect(manifest.version).toBe(pkg.version);
  });

  it('is described in Persian and claims nothing it does not do', () => {
    expect(manifest.name).toBe('تقویم');
    expect(manifest.description).toContain('بدون اینترنت');
    expect(manifest.offline_enabled).toBe(true);
  });
});

describe('firefox manifest', () => {
  it('keeps the new-tab override, which Firefox has supported since 54', () => {
    expect(firefox.chrome_url_overrides).toEqual({ newtab: 'newtab.html' });
  });

  // No id means AMO has nothing to sign against, and every upload after the
  // first would be filed as a different add-on.
  it('carries a gecko id and a minimum version', () => {
    expect(firefox.browser_specific_settings.gecko.id).toBe('taghvim@taghv.im');
    expect(firefox.browser_specific_settings.gecko.strict_min_version).toBe('140.0');
  });

  // 140 is the floor for this key; declaring "none" is what stops Firefox
  // showing a data-consent prompt for an add-on that collects nothing.
  it('declares that it collects no data', () => {
    expect(firefox.browser_specific_settings.gecko.data_collection_permissions).toEqual({ required: ['none'] });
  });

  it('drops the Chrome-only keys that AMO flags', () => {
    expect(firefox.offline_enabled).toBeUndefined();
    expect(firefox.minimum_chrome_version).toBeUndefined();
    expect(firefox.update_url).toBeUndefined();
  });

  it('asks for nothing in Firefox either', () => {
    expect(firefox.permissions).toEqual([]);
    expect(firefox.host_permissions).toEqual([]);
    expect(firefox.content_security_policy).toBeUndefined();
  });

  // The Chrome package must not carry Gecko keys: Chrome ignores them, but a
  // leaked key is a sign the two manifests were merged the wrong way round.
  it('leaves the Chrome manifest untouched', () => {
    expect(manifest.browser_specific_settings).toBeUndefined();
    expect(manifest.offline_enabled).toBe(true);
  });
});
