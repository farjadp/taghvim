// ============================================================================
// Source: src/lib/widget-sync.test.ts
// Version: 0.1.0 — 2026-09-10
// Why: The widget bridge must be silent everywhere but the app, and must send
//      exactly the four fields the widgets follow — never the memorial switch.
// Env / Deps: Vitest; a fake `Capacitor` host.
// ============================================================================

import { describe, expect, it, vi } from 'vitest';
import { DEFAULT_VIEW } from './view';
import { syncWidgets } from './widget-sync';

describe('widget sync', () => {
  it('does nothing on the site and in the extensions, where there is no native bridge', () => {
    expect(() => syncWidgets(DEFAULT_VIEW, {})).not.toThrow();
    const setView = vi.fn(() => Promise.resolve());
    syncWidgets(DEFAULT_VIEW, { Capacitor: { isNativePlatform: () => false, Plugins: { WidgetSync: { setView } } } });
    expect(setView).not.toHaveBeenCalled();
  });

  it('sends the groups and month names, and nothing else, inside the app', () => {
    const setView = vi.fn(() => Promise.resolve());
    const view = { ...DEFAULT_VIEW, religious: true, avestan: true, memorial: false };
    syncWidgets(view, { Capacitor: { isNativePlatform: () => true, Plugins: { WidgetSync: { setView } } } });
    expect(setView).toHaveBeenCalledWith({ religious: true, state: false, world: true, avestan: true });
  });

  it('falls back to registerPlugin, and swallows a rejected call', async () => {
    const setView = vi.fn(() => Promise.reject(new Error('bridge gone')));
    const registerPlugin = vi.fn(() => ({ setView }));
    syncWidgets(DEFAULT_VIEW, { Capacitor: { isNativePlatform: () => true, registerPlugin } });
    expect(registerPlugin).toHaveBeenCalledWith('WidgetSync');
    await Promise.resolve();
    expect(setView).toHaveBeenCalledTimes(1);
  });
});
