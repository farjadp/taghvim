// ============================================================================
// Source: src/lib/extension.test.ts
// Version: 0.9.8 — 2026-09-08
// Why: The extension's manifest is a promise — no permissions, no remote
//      code — and a promise nobody re-reads. These keep it honest, and keep
//      its version in step with the package so a release cannot ship two
//      different numbers.
// Env / Deps: Vitest; reads extension/manifest.json and package.json.
// ============================================================================

import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const root = fileURLToPath(new URL('../..', import.meta.url));
const manifest = JSON.parse(readFileSync(`${root}extension/manifest.json`, 'utf8'));
const pkg = JSON.parse(readFileSync(`${root}package.json`, 'utf8'));

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
