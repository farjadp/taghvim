// ============================================================================
// Source: src/lib/native-export.test.ts
// Version: 0.3.0 — 2026-11-20
// Why: The native export must be invisible on the site and in the extensions,
//      send exactly the agreed payload inside the app, answer 'unavailable' on iOS (no
//      plugin defined: a known gap), and surface any other native failure.
// Env / Deps: Vitest; a fake `Capacitor` host.
// ============================================================================

import { describe, expect, it, vi } from 'vitest';
import { exportFileNatively, isNativePlatform } from './native-export';

const FILE = { fileName: 'taghvim-dates.ics', mimeType: 'text/calendar', content: 'BEGIN:VCALENDAR\r\n' };

describe('native export', () => {
  it('is unavailable with no Capacitor, and when not native, without calling the plugin', async () => {
    expect(await exportFileNatively(FILE, {})).toBe('unavailable');
    const share = vi.fn(() => Promise.resolve({ shared: true }));
    expect(await exportFileNatively(FILE, { Capacitor: { isNativePlatform: () => false, Plugins: { FileExport: { share } } } })).toBe('unavailable');
    expect(share).not.toHaveBeenCalled();
  });

  it('is unavailable when native but the plugin is missing', async () => {
    expect(await exportFileNatively(FILE, { Capacitor: { isNativePlatform: () => true } })).toBe('unavailable');
  });

  it('sends exactly fileName, mimeType and content inside the app', async () => {
    const share = vi.fn(() => Promise.resolve({ shared: true }));
    expect(await exportFileNatively(FILE, { Capacitor: { isNativePlatform: () => true, Plugins: { FileExport: { share } } } })).toBe('shared');
    expect(share).toHaveBeenCalledWith(FILE);
  });

  it('counts a dismissed sheet as shared, and falls back to registerPlugin', async () => {
    const share = vi.fn(() => Promise.resolve({ shared: false }));
    const registerPlugin = vi.fn(() => ({ share }));
    expect(await exportFileNatively(FILE, { Capacitor: { isNativePlatform: () => true, registerPlugin } })).toBe('shared');
    expect(registerPlugin).toHaveBeenCalledWith('FileExport');
  });

  it("answers 'unavailable' on iOS, where the native bridge defines no FileExport and no registerPlugin", async () => {
    expect(await exportFileNatively(FILE, { Capacitor: { isNativePlatform: () => true, Plugins: {} } })).toBe('unavailable');
  });

  it('treats a registered plugin that reports UNIMPLEMENTED as unavailable (defensive branch)', async () => {
    const share = vi.fn(() => Promise.reject(Object.assign(new Error('not implemented'), { code: 'UNIMPLEMENTED' })));
    expect(await exportFileNatively(FILE, { Capacitor: { isNativePlatform: () => true, Plugins: { FileExport: { share } } } })).toBe('unavailable');
  });

  it('surfaces any other native failure instead of hiding it', async () => {
    const share = vi.fn(() => Promise.reject(new Error('disk full')));
    await expect(exportFileNatively(FILE, { Capacitor: { isNativePlatform: () => true, Plugins: { FileExport: { share } } } })).rejects.toThrow('disk full');
  });

  it('passes a binary payload and the share text through untouched', async () => {
    const share = vi.fn(() => Promise.resolve({ shared: true }));
    const host = { Capacitor: { isNativePlatform: () => true, Plugins: { FileExport: { share } } } };
    const png = { fileName: 'taghvim-1405-06-15.png', mimeType: 'image/png', base64: 'iVBORw0KGgo=', text: 'امروز' };
    expect(await exportFileNatively(png, host)).toBe('shared');
    expect(share).toHaveBeenCalledWith(png);
    const jpg = { fileName: 'a.jpg', mimeType: 'image/jpeg', base64: '/9j/4AAQ' };
    expect(await exportFileNatively(jpg, host)).toBe('shared');
  });

  it('refuses both payloads, neither, and pairs outside the allowed three, before the bridge', async () => {
    const share = vi.fn(() => Promise.resolve({ shared: true }));
    const host = { Capacitor: { isNativePlatform: () => true, Plugins: { FileExport: { share } } } };
    const bad = [
      { fileName: 'a.png', mimeType: 'image/png', base64: 'AA==', content: 'x' },
      { fileName: 'a.png', mimeType: 'image/png' },
      { fileName: 'a.png', mimeType: 'image/png', content: 'x' },
      { fileName: 'a.ics', mimeType: 'text/calendar', base64: 'AA==' },
      { fileName: 'a.png', mimeType: 'image/jpeg', base64: 'AA==' },
      { fileName: 'a.html', mimeType: 'text/html', content: '<p>' },
    ] as unknown as Parameters<typeof exportFileNatively>[0][];
    for (const file of bad) await expect(exportFileNatively(file, host)).rejects.toThrow('invalid native file');
    expect(share).not.toHaveBeenCalled();
  });

  it('reports whether it is running natively', () => {
    expect(isNativePlatform({})).toBe(false);
    expect(isNativePlatform({ Capacitor: { isNativePlatform: () => true } })).toBe(true);
  });
});
