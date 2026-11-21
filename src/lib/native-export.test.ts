// ============================================================================
// Source: src/lib/native-export.test.ts
// Version: 0.1.0 — 2026-11-20
// Why: The native export must be invisible on the site and in the extensions,
//      send exactly the agreed payload inside the app, fall back on iOS
//      (UNIMPLEMENTED), and surface any other native failure.
// Env / Deps: Vitest; a fake `Capacitor` host.
// ============================================================================

import { describe, expect, it, vi } from 'vitest';
import { exportFileNatively } from './native-export';

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

  it('falls back to the browser download when the platform has no implementation (iOS)', async () => {
    const share = vi.fn(() => Promise.reject(Object.assign(new Error('not implemented'), { code: 'UNIMPLEMENTED' })));
    expect(await exportFileNatively(FILE, { Capacitor: { isNativePlatform: () => true, Plugins: { FileExport: { share } } } })).toBe('unavailable');
  });

  it('surfaces any other native failure instead of hiding it', async () => {
    const share = vi.fn(() => Promise.reject(new Error('disk full')));
    await expect(exportFileNatively(FILE, { Capacitor: { isNativePlatform: () => true, Plugins: { FileExport: { share } } } })).rejects.toThrow('disk full');
  });
});
