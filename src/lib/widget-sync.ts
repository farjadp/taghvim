// ============================================================================
// Source: src/lib/widget-sync.ts
// Version: 0.2.1 — 2026-11-13
// Why: Hands the home-screen widgets the visitor's view — the four event
//      groups and the older month names — so a widget shows what the calendar
//      on screen shows. Only inside the Android and iPhone apps: there the
//      native side injects `window.Capacitor` and registers the WidgetSync
//      plugin (WidgetSyncPlugin.kt on Android, WidgetSyncPlugin.swift on iOS,
//      which keeps the same JS name so this one file serves both). Everywhere
//      else — the site, the Chrome and Firefox extensions — it finds no native
//      platform and does nothing. It reads the global rather than importing
//      @capacitor/core, so neither bundle grows and the extension's
//      no-network check has nothing new to look at. The memorial switch and
//      personal dates never cross.
// Env / Deps: None. The native bridge, when present.
// ============================================================================

import type { ViewPreferences } from './view';

export type WidgetView = Pick<ViewPreferences, 'festival' | 'religious' | 'state' | 'world' | 'avestan'>;

type WidgetSync = { setView(view: WidgetView): Promise<unknown> };
type Bridge = {
  isNativePlatform?: () => boolean;
  Plugins?: { WidgetSync?: WidgetSync };
  registerPlugin?: (name: string) => WidgetSync;
};

export function syncWidgets(view: ViewPreferences, host: unknown = globalThis): void {
  const capacitor = (host as { Capacitor?: Bridge }).Capacitor;
  if (!capacitor?.isNativePlatform?.()) return;
  const plugin = capacitor.Plugins?.WidgetSync ?? capacitor.registerPlugin?.('WidgetSync');
  if (!plugin) return;
  const { festival, religious, state, world, avestan } = view;
  // A failure here must not disturb the page; the widget keeps its last copy.
  plugin.setView({ festival, religious, state, world, avestan }).catch(() => undefined);
}
