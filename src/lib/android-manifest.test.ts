// ============================================================================
// Source: src/lib/android-manifest.test.ts
// Version: 0.1.0 — 2026-11-20
// Why: The Android app's zero-request promise is enforced by the system only
//      while the manifest keeps it: no INTERNET, no network-state probes, no
//      exact alarms, and no backup or device-transfer path for the WebView's
//      storage (the list of personal dates is people's names). Nothing else
//      reads the manifest, so a stray permission or a dropped exclusion would
//      ship silently. Comments are stripped first: the manifest's own header
//      mentions INTERNET in prose.
// Env / Deps: Vitest; reads mobile/android/app/app/src/main/AndroidManifest.xml
//      and res/xml/data_extraction_rules.xml.
// ============================================================================

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const root = fileURLToPath(new URL('../..', import.meta.url));
const main = `${root}mobile/android/app/app/src/main/`;

const stripComments = (xml: string) => xml.replace(/<!--[\s\S]*?-->/g, '');
const manifest = stripComments(readFileSync(`${main}AndroidManifest.xml`, 'utf8'));
const rules = stripComments(readFileSync(`${main}res/xml/data_extraction_rules.xml`, 'utf8'));

const DOMAINS = [
  'root',
  'file',
  'database',
  'sharedpref',
  'external',
  'device_root',
  'device_file',
  'device_database',
  'device_sharedpref',
];

// Names of every <uses-permission> / <uses-permission-sdk-23> element.
const permissions = [
  ...manifest.matchAll(/<uses-permission(?:-sdk-\d+)?\b[^>]*?android:name\s*=\s*"([^"]+)"/g),
].map((m) => m[1]);

// The domains excluded with path "." inside one block (<device-transfer> or <cloud-backup>).
function excluded(block: string): string[] {
  const body = rules.match(new RegExp(`<${block}\\b[^>]*>([\\s\\S]*?)</${block}>`))?.[1] ?? '';
  return [...body.matchAll(/<exclude\b([^>]*)>/g)]
    .filter((m) => /path\s*=\s*"\."/.test(m[1]))
    .map((m) => m[1].match(/domain\s*=\s*"([^"]+)"/)?.[1] ?? '');
}

describe('AndroidManifest.xml', () => {
  it('declares no network or exact-alarm permission', () => {
    const banned = permissions.filter(
      (p) =>
        p === 'android.permission.INTERNET' ||
        p === 'android.permission.ACCESS_NETWORK_STATE' ||
        p === 'android.permission.ACCESS_WIFI_STATE' ||
        /_EXACT_ALARM$/.test(p),
    );
    expect(banned).toEqual([]);
  });

  it('turns backup off and points at the extraction rules', () => {
    expect(manifest).toMatch(/android:allowBackup\s*=\s*"false"/);
    expect(manifest).toMatch(/android:dataExtractionRules\s*=\s*"@xml\/data_extraction_rules"/);
  });
});

describe('data_extraction_rules.xml', () => {
  for (const block of ['device-transfer', 'cloud-backup']) {
    it(`<${block}> excludes all nine domains`, () => {
      const got = excluded(block);
      for (const domain of DOMAINS) expect(got, `${block} misses ${domain}`).toContain(domain);
    });
  }
});
