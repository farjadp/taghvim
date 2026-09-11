// ============================================================================
// Source: src/lib/downloads.test.ts
// Version: 0.1.0 — 2026-09-11
// Why: The apps panel must not offer a download that does not exist, and the
//      day it does, it must carry the certificate that lets anyone check the
//      file. Both states are built by appsPanel, so both are tested here
//      without waiting for the release.
// Env / Deps: Vitest; lib/downloads.
// ============================================================================

import { describe, expect, it } from 'vitest';
import { ANDROID_APK_URL, ANDROID_CERT_SHA256, appsPanel } from './downloads';

const URL = 'https://github.com/farjadp/taghvim/releases/download/android-v1.0/taghvim-1.0.apk';

describe('apps panel', () => {
  it('offers nothing to download while there is no APK', () => {
    const panel = appsPanel(null);
    const android = panel.platforms.find((p) => p.id === 'android')!;
    expect(android.status).toBe('building');
    expect(android.action).toBeUndefined();
    expect(android.fingerprint).toBeUndefined();
    expect(panel.summary).toContain('در دست کدنویسی');
    expect(panel.timing).toContain('زمان انتشار هنوز معلوم نیست');
  });

  it('offers the APK, its certificate and the install caveat once there is one', () => {
    const panel = appsPanel(URL);
    const android = panel.platforms.find((p) => p.id === 'android')!;
    expect(android.status).toBe('ready');
    expect(android.action).toEqual({ label: 'دریافت فایل نصبی (APK)', href: URL, external: true });
    expect(android.fingerprint).toBe(ANDROID_CERT_SHA256);
    expect(android.points.join(' ')).toContain('بدون مجوز اینترنت');
    // The way past Play Protect's «unknown developer» block, named by the exact
    // labels the phone shows.
    expect(android.points.join(' ')).toContain('«More details»');
    expect(android.points.join(' ')).toContain('«Install anyway»');
    // The iPhone is untouched: still in development, still no date.
    expect(panel.platforms.find((p) => p.id === 'ios')!.status).toBe('building');
    expect(panel.timing).toContain('نسخهٔ آیفون');
  });

  it('carries the fingerprint of the key that signed the first release', () => {
    // 32 bytes, colon-separated, as apksigner and keytool print it.
    expect(ANDROID_CERT_SHA256).toMatch(/^([0-9A-F]{2}:){31}[0-9A-F]{2}$/);
    expect(ANDROID_CERT_SHA256.replaceAll(':', '').toLowerCase())
      .toBe('2a21288e2ba9a813c2198483d8292d9d03947d19c3d8717e42da8ecf6c7b686e');
  });

  it('points at one release by its tag, never at «latest»', () => {
    // Null until Farjad approves the release; after, a fixed per-version URL.
    if (ANDROID_APK_URL !== null) {
      // android-v1.0 / android-v1.1 were APK-only releases; from 0.9.39 the APK sits
      // in the release of the site version that built it (v0.9.39 → taghvim-1.2.apk).
      expect(ANDROID_APK_URL).toMatch(/^https:\/\/github\.com\/farjadp\/taghvim\/releases\/download\/(android-)?v[\d.]+\/taghvim-[\d.]+\.apk$/);
      // The unsigned CI build sits in the same release; the page must offer the signed one.
      expect(ANDROID_APK_URL).not.toContain('-unsigned');
    }
    expect(ANDROID_APK_URL ?? '').not.toContain('/latest/');
  });
});
