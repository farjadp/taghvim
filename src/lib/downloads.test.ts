// ============================================================================
// Source: src/lib/downloads.test.ts
// Version: 0.2.0 — 2026-10-07
// Why: The apps panel must not offer a download that does not exist, and the
//      day it does, it must carry the certificate that lets anyone check the
//      file. Both states are built by appsPanel, so both are tested here
//      without waiting for the release.
// Env / Deps: Vitest; lib/downloads.
// ============================================================================

import { describe, expect, it } from 'vitest';
import { ANDROID_APK_URL, ANDROID_CERT_SHA256, APP_STORE_URL, appsPanel } from './downloads';

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

  it('offers the App Store listing once the iPhone app is out, and no pending line', () => {
    const store = 'https://apps.apple.com/app/id6819758617';
    const panel = appsPanel(URL, store);
    const ios = panel.platforms.find((p) => p.id === 'ios')!;
    expect(ios.status).toBe('ready');
    expect(ios.action).toEqual({ label: 'دریافت از App Store', href: store, external: true });
    expect(ios.points.join(' ')).toContain('صفحهٔ قفل');
    expect(panel.summary).toContain('هر دو برنامه آماده است');
    // Nothing is pending, so nothing claims a date or a «not yet».
    expect(panel.timing).toBeNull();
    // Apple's store is not reachable from inside Iran; the panel keeps saying so.
    expect(panel.note).toContain('ایران');
  });

  it('points the App Store button at the app by its id, never at a search', () => {
    if (APP_STORE_URL !== null) expect(APP_STORE_URL).toMatch(/^https:\/\/apps\.apple\.com\/app\/id\d+$/);
  });

  it('carries the fingerprint of the key that signs 1.3 and Google Play', () => {
    // 32 bytes, colon-separated, as apksigner and keytool print it.
    expect(ANDROID_CERT_SHA256).toMatch(/^([0-9A-F]{2}:){31}[0-9A-F]{2}$/);
    expect(ANDROID_CERT_SHA256.replaceAll(':', '').toLowerCase())
      .toBe('af5b0888e09f6b190fa966c7378129d703bd3c2bcbd4f522328bac131b11237b');
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
